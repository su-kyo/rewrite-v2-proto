/**
 * useRiveBackground
 *
 * background.riv를 관리하는 훅.
 * - Artboard      : background
 * - State Machine : BackgroundSM
 * - View Model    : BackgroundVM  (Data Binding 방식)
 *   · moveTrigger (Trigger)
 * - Event         : onArrived
 *
 * Layout: Fit.Cover — viewport를 완전히 채움 (여백 없음)
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  Rive,
  EventType,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas';
import type {
  Event as RiveEvent,
  ViewModelInstanceTrigger,
} from '@rive-app/canvas';

interface UseRiveBackgroundOptions {
  onArrived: () => void;
}

interface UseRiveBackgroundReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  triggerMove: () => void;
}

export function useRiveBackground({
  onArrived,
}: UseRiveBackgroundOptions): UseRiveBackgroundReturn {
  const canvasRef        = useRef<HTMLCanvasElement | null>(null);
  const riveRef          = useRef<Rive | null>(null);
  // ★ ViewModel 방식 — StateMachineInput 대신 ViewModelInstanceTrigger 사용
  const moveTriggerRef   = useRef<ViewModelInstanceTrigger | null>(null);
  const eventHandlerRef  = useRef<((e: RiveEvent) => void) | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  // 항상 최신 콜백 참조 (stale closure 방지)
  const onArrivedRef = useRef(onArrived);
  useEffect(() => {
    onArrivedRef.current = onArrived;
  }, [onArrived]);

  // ── Rive 초기화 (마운트 시 1회) ──────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const r = new Rive({
      src: '/rive/background.riv',
      canvas: canvasRef.current,
      artboard: 'background',
      stateMachines: 'BackgroundSM',
      // Fit.Cover: 비율 유지하면서 viewport 완전히 채움
      layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
      autoplay: true,
      onLoad: () => {
        // ★ ViewModel (Data Binding) 방식으로 moveTrigger 접근
        const vm   = r.viewModelByName('BackgroundVM');
        const inst = vm?.defaultInstance?.() ?? null;
        if (inst) {
          moveTriggerRef.current = inst.trigger('moveTrigger');
          r.bindViewModelInstance(inst);
        } else {
          console.warn('[useRiveBackground] BackgroundVM 인스턴스를 찾을 수 없습니다.');
        }

        // onArrived Rive 이벤트 구독
        const handleRiveEvent = (event: RiveEvent) => {
          const name =
            (event.data as { name?: string } | undefined)?.name ??
            (event as unknown as { name?: string }).name;
          if (name === 'onArrived') {
            onArrivedRef.current();
          }
        };

        eventHandlerRef.current = handleRiveEvent;
        r.on(EventType.RiveEvent, handleRiveEvent);

        // ★ 초기 로드 후 canvas 크기 맞춤
        const el = canvasRef.current;
        if (el) {
          el.width  = window.innerWidth;
          el.height = window.innerHeight;
          r.resizeDrawingSurfaceToCanvas();
        }
      },
    });

    riveRef.current = r;

    // ★ 리사이즈 시 canvas + Rive 내부 렌더 뷰포트 동기화
    const handleResize = () => {
      const el = canvasRef.current;
      if (!el || !riveRef.current) return;
      el.width  = window.innerWidth;
      el.height = window.innerHeight;
      riveRef.current.resizeDrawingSurfaceToCanvas();
    };
    resizeHandlerRef.current = handleResize;
    window.addEventListener('resize', handleResize);

    return () => {
      // event listener 명시적 cleanup
      if (eventHandlerRef.current) {
        r.off(EventType.RiveEvent, eventHandlerRef.current);
        eventHandlerRef.current = null;
      }
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      r.cleanup();
      riveRef.current      = null;
      moveTriggerRef.current = null;
    };
  }, []);

  // ── moveTrigger 실행 ──────────────────────────────────────────────────────
  const triggerMove = useCallback(() => {
    moveTriggerRef.current?.trigger();
  }, []);

  return { canvasRef, triggerMove };
}
