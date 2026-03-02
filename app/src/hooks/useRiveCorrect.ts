/**
 * useRiveCorrect
 *
 * layer_step1.riv / layer_step2.riv 를 관리하는 훅.
 * step1 / step2 두 아트보드를 각각 독립된 Rive 인스턴스로 사용.
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
import type {
  Event as RiveEvent,
  ViewModelInstanceNumber,
  ViewModelInstanceTrigger,
} from '@rive-app/canvas';

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
  // ── Step1 refs ──────────────────────────────────────────────────────────
  const step1CanvasRef       = useRef<HTMLCanvasElement | null>(null);
  const step1RiveRef         = useRef<Rive | null>(null);
  const step1LeftRef         = useRef<ViewModelInstanceNumber | null>(null);
  const step1TriggerRef      = useRef<ViewModelInstanceTrigger | null>(null);
  const step1PrevLeft        = useRef<number | null>(null);
  const step1ResizeHandlerRef = useRef<(() => void) | null>(null);

  // ── Step2 refs ──────────────────────────────────────────────────────────
  const step2CanvasRef         = useRef<HTMLCanvasElement | null>(null);
  const step2RiveRef           = useRef<Rive | null>(null);
  const step2LeftRef           = useRef<ViewModelInstanceNumber | null>(null);
  const step2RightRef          = useRef<ViewModelInstanceNumber | null>(null);
  const step2TriggerRef        = useRef<ViewModelInstanceTrigger | null>(null);
  const step2PrevLeft          = useRef<number | null>(null);
  const step2PrevRight         = useRef<number | null>(null);
  const step2ResizeHandlerRef  = useRef<(() => void) | null>(null);
  const step2EventHandlerRef   = useRef<((e: RiveEvent) => void) | null>(null);
  const step2FallbackTimerRef  = useRef<number | null>(null);

  // stale closure 방지 — onStep2Done 항상 최신 참조 유지
  const onStep2DoneRef = useRef(onStep2Done);
  useEffect(() => { onStep2DoneRef.current = onStep2Done; }, [onStep2Done]);

  // ── Step1 Rive 초기화 ────────────────────────────────────────────────────
  useEffect(() => {
    if (!step1CanvasRef.current) return;

    const r = new Rive({
      src: '/rive/layer_step1.riv',
      canvas: step1CanvasRef.current,
      artboard: 'step1',
      stateMachines: 'Step1SM',
      // step1: 320×720 비율 유지 (Contain)
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      autoplay: true,
      onLoad: () => {
        // ★ ViewModel(Data Binding) 방식으로 프로퍼티 접근
        const vm   = r.viewModelByName('Step1VM');
        const inst = vm?.defaultInstance?.() ?? null;

        if (inst) {
          r.bindViewModelInstance(inst);
          step1LeftRef.current    = inst.number('left/skinID');
          step1TriggerRef.current = inst.trigger('step1Correct');
        } else {
          console.warn('[useRiveCorrect] Step1VM 인스턴스를 찾을 수 없습니다.');
        }

        // ★ 초기 로드 후 canvas 크기 맞춤
        const el = step1CanvasRef.current;
        if (el) {
          const h = window.innerHeight;
          el.height = h;
          el.width  = Math.round(h * (320 / 720));
          r.resizeDrawingSurfaceToCanvas();
        }
      },
    });

    step1RiveRef.current = r;

    // ★ 리사이즈 시 canvas + Rive 내부 렌더 뷰포트 동기화
    const handleResize = () => {
      const el = step1CanvasRef.current;
      if (!el || !step1RiveRef.current) return;
      const h = window.innerHeight;
      el.height = h;
      el.width  = Math.round(h * (320 / 720));
      step1RiveRef.current.resizeDrawingSurfaceToCanvas();
    };
    step1ResizeHandlerRef.current = handleResize;
    window.addEventListener('resize', handleResize);

    return () => {
      if (step1ResizeHandlerRef.current) {
        window.removeEventListener('resize', step1ResizeHandlerRef.current);
        step1ResizeHandlerRef.current = null;
      }
      r.cleanup();
      step1RiveRef.current    = null;
      step1LeftRef.current    = null;
      step1TriggerRef.current = null;
    };
  }, []);

  // ── Step2 Rive 초기화 ────────────────────────────────────────────────────
  useEffect(() => {
    if (!step2CanvasRef.current) return;

    const r = new Rive({
      src: '/rive/layer_step2.riv',
      canvas: step2CanvasRef.current,
      artboard: 'step2',
      stateMachines: 'Step2SM',
      // step2: 전체 화면 cover
      layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
      autoplay: true,
      onLoad: () => {
        // ★ ViewModel(Data Binding) 방식으로 프로퍼티 접근
        const vm   = r.viewModelByName('Step2VM');
        const inst = vm?.defaultInstance?.() ?? null;

        if (inst) {
          r.bindViewModelInstance(inst);
          step2LeftRef.current    = inst.number('left/skinID');
          step2RightRef.current   = inst.number('right/skinID');
          step2TriggerRef.current = inst.trigger('step2Correct');
        } else {
          console.warn('[useRiveCorrect] Step2VM 인스턴스를 찾을 수 없습니다.');
        }

        // ★ layerDone 이벤트 구독 — 애니메이션 종료 시 onStep2Done 콜백 호출
        const handleRiveEvent = (event: RiveEvent) => {
          const name =
            (event.data as { name?: string } | undefined)?.name ??
            (event as unknown as { name?: string }).name;
          if (name === 'layerDone') {
            // 폴백 타이머 취소
            if (step2FallbackTimerRef.current !== null) {
              window.clearTimeout(step2FallbackTimerRef.current);
              step2FallbackTimerRef.current = null;
            }
            // ★ React 리렌더를 기다리지 않고 DOM을 직접 즉시 비활성화 — 버튼 즉시 활성화
            if (step2CanvasRef.current) {
              step2CanvasRef.current.style.pointerEvents = 'none';
            }
            onStep2DoneRef.current?.();
          }
        };
        step2EventHandlerRef.current = handleRiveEvent;
        r.on(EventType.RiveEvent, handleRiveEvent);

        // ★ 초기 로드 후 canvas 크기 맞춤
        const el = step2CanvasRef.current;
        if (el) {
          el.width  = window.innerWidth;
          el.height = window.innerHeight;
          r.resizeDrawingSurfaceToCanvas();
        }
      },
    });

    step2RiveRef.current = r;

    // ★ 리사이즈 시 canvas + Rive 내부 렌더 뷰포트 동기화
    const handleResize = () => {
      const el = step2CanvasRef.current;
      if (!el || !step2RiveRef.current) return;
      el.width  = window.innerWidth;
      el.height = window.innerHeight;
      step2RiveRef.current.resizeDrawingSurfaceToCanvas();
    };
    step2ResizeHandlerRef.current = handleResize;
    window.addEventListener('resize', handleResize);

    return () => {
      if (step2FallbackTimerRef.current !== null) {
        window.clearTimeout(step2FallbackTimerRef.current);
        step2FallbackTimerRef.current = null;
      }
      if (step2EventHandlerRef.current) {
        r.off(EventType.RiveEvent, step2EventHandlerRef.current);
        step2EventHandlerRef.current = null;
      }
      if (step2ResizeHandlerRef.current) {
        window.removeEventListener('resize', step2ResizeHandlerRef.current);
        step2ResizeHandlerRef.current = null;
      }
      r.cleanup();
      step2RiveRef.current    = null;
      step2LeftRef.current    = null;
      step2RightRef.current   = null;
      step2TriggerRef.current = null;
    };
  }, []);

  // ── Step1 정답 트리거 ────────────────────────────────────────────────────
  const fireStep1Correct = useCallback(() => {
    const left = randomExclude(3, step1PrevLeft.current);
    step1PrevLeft.current = left;

    if (step1LeftRef.current)    step1LeftRef.current.value = left;
    if (step1TriggerRef.current) step1TriggerRef.current.trigger();
  }, []);

  // ── Step2 정답 트리거 ────────────────────────────────────────────────────
  const fireStep2Correct = useCallback(() => {
    // 이전 폴백 타이머 초기화 (연속 호출 방어)
    if (step2FallbackTimerRef.current !== null) {
      window.clearTimeout(step2FallbackTimerRef.current);
      step2FallbackTimerRef.current = null;
    }

    // left: 0~6, right: 0~6, 서로 달라야 하고 직전 조합 최대한 회피
    const left = randomExclude(6, step2PrevLeft.current);

    // right: left와 다르게 + 직전 right와 다르게 시도
    let right = randomExclude(6, left);
    if (right === step2PrevRight.current) {
      const candidate = randomExclude(6, left);
      if (candidate !== step2PrevRight.current) right = candidate;
    }

    step2PrevLeft.current  = left;
    step2PrevRight.current = right;

    if (step2LeftRef.current)    step2LeftRef.current.value  = left;
    if (step2RightRef.current)   step2RightRef.current.value = right;
    if (step2TriggerRef.current) step2TriggerRef.current.trigger();

    // ★ 폴백: layerDone 이벤트가 오지 않는 경우를 대비해 일정 시간 후 강제 종료
    step2FallbackTimerRef.current = window.setTimeout(() => {
      console.warn('[Step2] layerDone 이벤트 미수신 — 폴백으로 onStep2Done 호출');
      onStep2DoneRef.current?.();
      step2FallbackTimerRef.current = null;
    }, 2000);
  }, []);

  return { step1CanvasRef, step2CanvasRef, fireStep1Correct, fireStep2Correct };
}
