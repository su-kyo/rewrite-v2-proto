/**
 * RiveBackground
 *
 * background.riv 를 전체 화면 cover 방식으로 렌더링.
 * - 항상 가장 뒤 레이어 (z-index: 0)
 * - 창 크기 변화에 맞춰 canvas width/height 동기화
 */

import { useEffect, useCallback } from 'react';

interface RiveBackgroundProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function RiveBackground({ canvasRef }: RiveBackgroundProps) {
  useEffect(() => {
    const sync = () => {
      const el = canvasRef.current;
      if (!el) return;
      el.width  = window.innerWidth;
      el.height = window.innerHeight;
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [canvasRef]);

  // RefObject<T | null>을 JSX ref에 안전하게 연결하는 콜백 패턴
  const attachRef = useCallback(
    (el: HTMLCanvasElement | null) => {
      (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
    },
    [canvasRef]
  );

  return <canvas ref={attachRef} className="rive-background" />;
}
