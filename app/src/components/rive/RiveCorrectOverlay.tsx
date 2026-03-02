/**
 * RiveCorrectOverlay
 *
 * layer_correct.riv 의 step1 / step2 아트보드 canvas 오버레이.
 * - z-index: 200, pointer-events: none (하위 인터랙션 통과)
 * - Step1: 320×720 비율, 브라우저 height 기준, 수평 중앙
 * - Step2: 전체 화면 cover
 */

import { useEffect, useCallback } from 'react';

interface RiveCorrectOverlayProps {
  step1CanvasRef: React.RefObject<HTMLCanvasElement | null>;
  step2CanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** step2 정답 완료 시 true → Confetti를 위해 step2 canvas에 pointer-events: auto 허용 */
  step2Active?: boolean;
}

const STEP1_RATIO = 320 / 720; // width / height

export default function RiveCorrectOverlay({
  step1CanvasRef,
  step2CanvasRef,
  step2Active = false,
}: RiveCorrectOverlayProps) {
  // Step1: height 기준 320×720 비율 유지
  useEffect(() => {
    const sync = () => {
      const el = step1CanvasRef.current;
      if (!el) return;
      const h  = window.innerHeight;
      el.height = h;
      el.width  = Math.round(h * STEP1_RATIO);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [step1CanvasRef]);

  // Step2: 전체 화면 cover
  useEffect(() => {
    const sync = () => {
      const el = step2CanvasRef.current;
      if (!el) return;
      el.width  = window.innerWidth;
      el.height = window.innerHeight;
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [step2CanvasRef]);

  // RefObject<T | null> → JSX ref 콜백 패턴
  const attachStep1 = useCallback(
    (el: HTMLCanvasElement | null) => {
      (step1CanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
    },
    [step1CanvasRef]
  );

  const attachStep2 = useCallback(
    (el: HTMLCanvasElement | null) => {
      (step2CanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
    },
    [step2CanvasRef]
  );

  return (
    <>
      {/* Step1 정답 레이어 — pointer-events: none 항상 유지 */}
      <canvas ref={attachStep1} className="rive-overlay rive-overlay--step1" />

      {/* Step2 정답 레이어 — active 시 표시, Confetti를 위해 step2Active일 때만 마우스 이벤트 허용 */}
      <canvas
        ref={attachStep2}
        className={`rive-overlay rive-overlay--step2${step2Active ? ' active' : ''}`}
        style={{ pointerEvents: step2Active ? 'auto' : 'none' }}
      />
    </>
  );
}
