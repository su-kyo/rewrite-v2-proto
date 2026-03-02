/**
 * useRiveCorrect
 *
 * layer_step1.riv / layer_step2.riv 를 관리하는 훅.
 * step1 / step2 두 아트보드를 각각 독립된 Rive 인스턴스로 사용.
 *
 * ── 인스턴스 생명주기 ────────────────────────────────────────────────────────
 * 마운트 시 즉시 생성하지 않고, fireStep1Correct / fireStep2Correct 호출 시점에
 * on-demand 로 생성하고 애니메이션 종료 후 즉시 해제한다.
 * (배경 불필요한 GPU/CPU 렌더링 방지)
 *
 * ── Step1 ──────────────────────────────────────────────────────────────────
 * Artboard      : step1
 * State Machine : Step1SM
 * View Model    : Step1VM  (Data Binding 방식)
 * Properties    : left (Animal1VM instance)
 *                   └ skinID (Number, 0~3)  ← 접근 경로: 'left/skinID'
 *                 step1Correct (Trigger)
 *
 * ── Step2 ──────────────────────────────────────────────────────────────────
 * Artboard      : step2
 * State Machine : Step2SM
 * View Model    : Step2VM  (Data Binding 방식)
 * Properties    : left  (Animal2VM instance)
 *                   └ skinID (Number, 0~6)  ← 접근 경로: 'left/skinID'
 *                 right (Animal2VM instance, must differ from left)
 *                   └ skinID (Number, 0~6)  ← 접근 경로: 'right/skinID'
 *                 step2Correct (Trigger)
 */

import { useEffect, useRef, useCallback } from 'react';
import { Rive, EventType, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import type { Event as RiveEvent } from '@rive-app/canvas';

// ── 랜덤 헬퍼 ─────────────────────────────────────────────────────────────────

/** 0..max 범위(inclusive)에서 prev 와 다른 랜덤 정수 */
function randomExclude(max: number, prev: number | null): number {
  if (max <= 0) return 0;
  let val: number;
  let tries = 0;
  do {
    val = Math.floor(Math.random() * (max + 1));
    tries++;
  } while (val === prev && tries < 20);
  return val;
}

// ── 훅 옵션 / 반환 타입 ────────────────────────────────────────────────────────

interface UseRiveCorrectOptions {
  /** Step2 layerDone 이벤트 발생 시 호출 — overlay 숨김 등에 사용 */
  onStep2Done?: () => void;
}

interface UseRiveCorrectReturn {
  step1CanvasRef: React.RefObject<HTMLCanvasElement | null>;
  step2CanvasRef: React.RefObject<HTMLCanvasElement | null>;
  fireStep1Correct: () => void;
  fireStep2Correct: () => void;
}

// ── 훅 ────────────────────────────────────────────────────────────────────────

export function useRiveCorrect({ onStep2Done }: UseRiveCorrectOptions = {}): UseRiveCorrectReturn {
  // ── canvas refs ──────────────────────────────────────────────────────────
  const step1CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const step2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Rive 인스턴스 refs (on-demand 생성) ──────────────────────────────────
  const step1RiveRef = useRef<Rive | null>(null);
  const step2RiveRef = useRef<Rive | null>(null);

  // ── 이전 skinID refs (중복 방지) ─────────────────────────────────────────
  const step1PrevLeft  = useRef<number | null>(null);
  const step2PrevLeft  = useRef<number | null>(null);
  const step2PrevRight = useRef<number | null>(null);

  // ── fallback 타이머 ───────────────────────────────────────────────────────
  const step2FallbackTimerRef = useRef<number | null>(null);

  // stale closure 방지 — onStep2Done 항상 최신 참조 유지
  const onStep2DoneRef = useRef(onStep2Done);
  useEffect(() => { onStep2DoneRef.current = onStep2Done; }, [onStep2Done]);

  // ── Step1 cleanup ─────────────────────────────────────────────────────────
  // resize 핸들러를 ref에 보관해 cleanup 시 제거 가능하게 함
  const step1ResizeRef = useRef<(() => void) | null>(null);

  const cleanupStep1 = useCallback(() => {
    if (step1ResizeRef.current) {
      window.removeEventListener('resize', step1ResizeRef.current);
      step1ResizeRef.current = null;
    }
    step1RiveRef.current?.cleanup();
    step1RiveRef.current = null;
  }, []);

  // ── Step2 cleanup ─────────────────────────────────────────────────────────
  const step2ResizeRef = useRef<(() => void) | null>(null);

  const cleanupStep2 = useCallback(() => {
    if (step2FallbackTimerRef.current !== null) {
      window.clearTimeout(step2FallbackTimerRef.current);
      step2FallbackTimerRef.current = null;
    }
    if (step2ResizeRef.current) {
      window.removeEventListener('resize', step2ResizeRef.current);
      step2ResizeRef.current = null;
    }
    step2RiveRef.current?.cleanup();
    step2RiveRef.current = null;
  }, []);

  // ── 언마운트 시 혹시 남은 인스턴스 강제 정리 ────────────────────────────
  useEffect(() => {
    return () => {
      cleanupStep1();
      cleanupStep2();
    };
  }, [cleanupStep1, cleanupStep2]);

  // ── Step1 정답 트리거 (on-demand 인스턴스 생성) ───────────────────────────
  const fireStep1Correct = useCallback(() => {
    const canvas = step1CanvasRef.current;
    if (!canvas) return;

    // 연속 호출 방어: 기존 인스턴스 먼저 해제
    cleanupStep1();

    const left = randomExclude(3, step1PrevLeft.current);
    step1PrevLeft.current = left;

    const r = new Rive({
      src: '/rive/layer_step1.riv',
      canvas,
      artboard: 'step1',
      stateMachines: 'Step1SM',
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      autoplay: true,
      onLoad: () => {
        // ★ ViewModel(Data Binding) 방식으로 프로퍼티 접근
        const vm   = r.viewModelByName('Step1VM');
        const inst = vm?.defaultInstance?.() ?? null;
        if (inst) {
          r.bindViewModelInstance(inst);
          const leftProp = inst.number('left/skinID');
          if (leftProp) leftProp.value = left;
          inst.trigger('step1Correct')?.trigger();
        } else {
          console.warn('[useRiveCorrect] Step1VM 인스턴스를 찾을 수 없습니다.');
        }

        // canvas 크기 초기화
        const el = step1CanvasRef.current;
        if (el) {
          const h = window.innerHeight;
          el.height = h;
          el.width  = Math.round(h * (320 / 720));
          r.resizeDrawingSurfaceToCanvas();
        }

        // resize 리스너 등록
        const handleResize = () => {
          const el = step1CanvasRef.current;
          if (!el || !step1RiveRef.current) return;
          const h = window.innerHeight;
          el.height = h;
          el.width  = Math.round(h * (320 / 720));
          step1RiveRef.current.resizeDrawingSurfaceToCanvas();
        };
        step1ResizeRef.current = handleResize;
        window.addEventListener('resize', handleResize);

        // ★ 애니메이션 종료 후 cleanup (App.tsx setStep(2) 1200ms보다 여유있게)
        window.setTimeout(() => {
          // onLoad 이후 외부에서 이미 cleanup된 경우 재호출 방지
          if (step1RiveRef.current === r) {
            cleanupStep1();
          }
        }, 1400);
      },
    });

    step1RiveRef.current = r;
  }, [cleanupStep1]);

  // ── Step2 정답 트리거 (on-demand 인스턴스 생성) ───────────────────────────
  const fireStep2Correct = useCallback(() => {
    const canvas = step2CanvasRef.current;
    if (!canvas) return;

    // 연속 호출 방어: 기존 인스턴스 먼저 해제 (fallback 타이머 포함)
    cleanupStep2();

    // left: 0~6, right: 0~6, 서로 달라야 하고 직전 조합 최대한 회피
    const left = randomExclude(6, step2PrevLeft.current);
    let right = randomExclude(6, left);
    if (right === step2PrevRight.current) {
      const candidate = randomExclude(6, left);
      if (candidate !== step2PrevRight.current) right = candidate;
    }
    step2PrevLeft.current  = left;
    step2PrevRight.current = right;

    const r = new Rive({
      src: '/rive/layer_step2.riv',
      canvas,
      artboard: 'step2',
      stateMachines: 'Step2SM',
      layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
      autoplay: true,
      onLoad: () => {
        // ★ ViewModel(Data Binding) 방식으로 프로퍼티 접근
        const vm   = r.viewModelByName('Step2VM');
        const inst = vm?.defaultInstance?.() ?? null;
        if (inst) {
          r.bindViewModelInstance(inst);
          const leftProp  = inst.number('left/skinID');
          const rightProp = inst.number('right/skinID');
          if (leftProp)  leftProp.value  = left;
          if (rightProp) rightProp.value = right;
          inst.trigger('step2Correct')?.trigger();
        } else {
          console.warn('[useRiveCorrect] Step2VM 인스턴스를 찾을 수 없습니다.');
        }

        // ★ layerDone 이벤트 구독 — 애니메이션 종료 시 cleanup
        const handleRiveEvent = (event: RiveEvent) => {
          const name =
            (event.data as { name?: string } | undefined)?.name ??
            (event as unknown as { name?: string }).name;
          if (name === 'layerDone') {
            // ★ React 리렌더를 기다리지 않고 DOM을 직접 즉시 비활성화
            if (step2CanvasRef.current) {
              step2CanvasRef.current.style.pointerEvents = 'none';
            }
            onStep2DoneRef.current?.();
            // 이미 cleanup된 경우 재호출 방지
            if (step2RiveRef.current === r) {
              cleanupStep2();
            }
          }
        };
        r.on(EventType.RiveEvent, handleRiveEvent);

        // canvas 크기 초기화
        const el = step2CanvasRef.current;
        if (el) {
          el.width  = window.innerWidth;
          el.height = window.innerHeight;
          r.resizeDrawingSurfaceToCanvas();
        }

        // resize 리스너 등록
        const handleResize = () => {
          const el = step2CanvasRef.current;
          if (!el || !step2RiveRef.current) return;
          el.width  = window.innerWidth;
          el.height = window.innerHeight;
          step2RiveRef.current.resizeDrawingSurfaceToCanvas();
        };
        step2ResizeRef.current = handleResize;
        window.addEventListener('resize', handleResize);

        // ★ 폴백: layerDone 이벤트가 오지 않는 경우를 대비해 일정 시간 후 강제 종료
        step2FallbackTimerRef.current = window.setTimeout(() => {
          console.warn('[Step2] layerDone 이벤트 미수신 — 폴백으로 onStep2Done 호출');
          onStep2DoneRef.current?.();
          if (step2RiveRef.current === r) {
            cleanupStep2();
          }
          step2FallbackTimerRef.current = null;
        }, 2000);
      },
    });

    step2RiveRef.current = r;
  }, [cleanupStep2]);

  return { step1CanvasRef, step2CanvasRef, fireStep1Correct, fireStep2Correct };
}
