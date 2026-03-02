import { useState, useCallback, useRef } from 'react';
import type { TokenState, DropState } from '@/types';
import { QUESTIONS } from '@/data/questions';
import Progress from '@/components/Progress';
import QuestionBox from '@/components/QuestionBox';
import CTA from '@/components/CTA';
import RiveBackground from '@/components/rive/RiveBackground';
import RiveCorrectOverlay from '@/components/rive/RiveCorrectOverlay';
import { useRiveBackground } from '@/hooks/useRiveBackground';
import { useRiveCorrect } from '@/hooks/useRiveCorrect';

// ─── 초기화 헬퍼 ──────────────────────────────────────────────────────────────

function initTokenStates(qIdx: number): Record<string, TokenState> {
  const result: Record<string, TokenState> = {};
  QUESTIONS[qIdx].parts.forEach((p) => {
    if (p.type === 'token' && p.id) result[p.id] = 'idle';
  });
  return result;
}

function initDropStates(qIdx: number): Record<string, DropState> {
  const result: Record<string, DropState> = {};
  Object.entries(QUESTIONS[qIdx].dropdownDefs).forEach(([id, def]) => {
    result[id] = { value: def.defaultValue, phase: 'normal', interacted: false, wrong: false };
  });
  return result;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [qIdx,           setQIdx]           = useState(0);
  const [step,           setStep]           = useState<1 | 2>(1);
  const [contentVisible, setContentVisible] = useState(true);
  const [gameComplete,   setGameComplete]   = useState(false);

  // Step 1 상태
  const [tokenStates,  setTokenStates]  = useState<Record<string, TokenState>>(() => initTokenStates(0));
  const [shakingToken, setShakingToken] = useState<string | null>(null);

  // Step 2 상태
  const [drops,        setDrops]        = useState<Record<string, DropState>>(() => initDropStates(0));
  const [openDrop,     setOpenDrop]     = useState<string | null>(null);
  const [step2Correct,    setStep2Correct]    = useState(false);
  const [step2AnimActive, setStep2AnimActive] = useState(false);

  // 다음 문제 전환 중 중복 호출 방지
  const isTransitioning = useRef(false);

  const question = QUESTIONS[qIdx];

  // ── Rive: background ───────────────────────────────────────────────────────
  // onArrived 이벤트 → 다음 문제 데이터 로드 + fade in
  const handleArrived = useCallback(() => {
    const nextIdx = qIdx + 1;
    setQIdx(nextIdx);
    setStep(1);
    setTokenStates(initTokenStates(nextIdx));
    setShakingToken(null);
    setDrops(initDropStates(nextIdx));
    setOpenDrop(null);
    setStep2Correct(false);
    setStep2AnimActive(false);
    setContentVisible(true);
    isTransitioning.current = false;
  }, [qIdx]);

  const { canvasRef: bgCanvasRef, triggerMove } = useRiveBackground({
    onArrived: handleArrived,
  });

  // ── Rive: correct overlays ─────────────────────────────────────────────────
  const { step1CanvasRef, step2CanvasRef, fireStep1Correct, fireStep2Correct } = useRiveCorrect({
    onStep2Done: () => setStep2AnimActive(false), // layerDone 이벤트 → overlay 숨김
  });

  // ── 파생 값 ─────────────────────────────────────────────────────────────────
  const correctTokenIds = question.parts
    .filter((p) => p.type === 'token' && p.isCorrect && p.id)
    .map((p) => p.id as string);

  const remaining = correctTokenIds.filter((id) => tokenStates[id] === 'idle').length;

  const allDropsInteracted = Object.values(drops).every((d) => d.phase !== 'normal' || d.interacted);
  const anyPendingDrops    = Object.values(drops).some((d) => d.phase === 'normal');
  const canSubmit          = allDropsInteracted && anyPendingDrops;

  // ── Step 1: 토큰 클릭 ────────────────────────────────────────────────────────
  const handleTokenClick = useCallback(
    (id: string, isCorrect: boolean) => {
      if (remaining === 0) return;
      if (tokenStates[id] !== 'idle') return;

      if (isCorrect) {
        const next = { ...tokenStates, [id]: 'found' as TokenState };
        setTokenStates(next);

        const newRemaining = correctTokenIds.filter((cid) => next[cid] === 'idle').length;
        if (newRemaining === 0) {
          // 모두 찾음 → Rive step1 정답 애니메이션 → Step2 전환
          setTimeout(() => {
            fireStep1Correct(); // ★ layer_correct step1 트리거 (HTML dim 제거)
            setTimeout(() => {
              setStep(2);
            }, 1200);
          }, 200);
        }
      } else {
        setTokenStates((prev) => ({ ...prev, [id]: 'missed' }));
        setShakingToken(id);
        setTimeout(() => setShakingToken(null), 900);
      }
    },
    [tokenStates, correctTokenIds, fireStep1Correct]
  );

  // ── Step 2: 드롭다운 선택 ────────────────────────────────────────────────────
  const handleDropSelect = useCallback((dropId: string, value: string) => {
    setDrops((prev) => ({
      ...prev,
      [dropId]: { ...prev[dropId], value, interacted: true, wrong: false },
    }));
    setOpenDrop(null);
  }, []);

  // ── Step 2: 제출 ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    setOpenDrop(null);

    const q = QUESTIONS[qIdx];
    let allCorrect = true;
    const correctIds: string[]                         = [];
    const updates: Record<string, Partial<DropState>> = {};

    Object.entries(drops).forEach(([id, state]) => {
      if (state.phase !== 'normal') return;
      const def           = q.dropdownDefs[id];
      const correctOption = def.options.find((o) => o.isCorrect);
      if (correctOption && state.value === correctOption.value) {
        correctIds.push(id);
        updates[id] = { phase: 'correct', wrong: false };
      } else {
        allCorrect = false;
        updates[id] = { wrong: true };
      }
    });

    setDrops((prev) => {
      const next = { ...prev };
      Object.entries(updates).forEach(([id, upd]) => {
        next[id] = { ...next[id], ...upd };
      });
      return next;
    });

    // correct → plain 전환
    if (correctIds.length > 0) {
      setTimeout(() => {
        setDrops((prev) => {
          const next = { ...prev };
          correctIds.forEach((id) => {
            if (next[id].phase === 'correct') next[id] = { ...next[id], phase: 'plain' };
          });
          return next;
        });
      }, 500);
    }

    if (allCorrect) {
      setStep2Correct(true);        // CTA '다음 문제' 버튼용 — 유지
      setStep2AnimActive(true);     // overlay 표시 — layerDone 이벤트에서 false로 복원
      fireStep2Correct(); // ★ layer_step2 트리거
    } else {
      setTimeout(() => {
        setDrops((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            if (next[id].wrong) next[id] = { ...next[id], wrong: false };
          });
          return next;
        });
      }, 900);
    }
  }, [drops, qIdx, fireStep2Correct]);

  // ── 다음 문제 / 완료 ─────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (isTransitioning.current) return;

    if (qIdx >= QUESTIONS.length - 1) {
      setGameComplete(true);
      return;
    }

    isTransitioning.current = true;

    // 1. UI fade out
    setContentVisible(false);

    // 2. fade out(0.4s) 완료 후 background moveTrigger 실행
    //    → Rive onArrived 이벤트 → handleArrived() → 데이터 로드 + fade in
    setTimeout(() => {
      triggerMove(); // ★ background moveTrigger
    }, 400);
  }, [qIdx, triggerMove]);

  // ── 완료 화면 ────────────────────────────────────────────────────────────────
  if (gameComplete) {
    return (
      <div className="app">
        <RiveBackground canvasRef={bgCanvasRef} />
        <div className="finish-card">
          <div className="finish-emoji">🎉</div>
          <p className="finish-title">모든 문제 완료!</p>
          <p className="finish-subtitle">수고했어요. 잘 해냈어요!</p>
        </div>
        <RiveCorrectOverlay
          step1CanvasRef={step1CanvasRef}
          step2CanvasRef={step2CanvasRef}
          step2Active={false}
        />
      </div>
    );
  }

  // ── 메인 ─────────────────────────────────────────────────────────────────────
  return (
    <div className="app" onClick={() => openDrop && setOpenDrop(null)}>
      {/* z-index: 0 — Rive 배경 */}
      <RiveBackground canvasRef={bgCanvasRef} />

      {/* z-index: 10 — UI 콘텐츠 */}
      <div className={`content${contentVisible ? '' : ' hidden'}`}>
        <Progress current={qIdx} total={QUESTIONS.length} />

        <QuestionBox
          question={question}
          step={step}
          remaining={remaining}
          tokenStates={tokenStates}
          shakingToken={shakingToken}
          onTokenClick={handleTokenClick}
          drops={drops}
          openDrop={openDrop}
          onDropToggle={(id) => setOpenDrop(openDrop === id ? null : id)}
          onDropSelect={handleDropSelect}
        />

        {step === 2 && (
          <CTA
            isLastQuestion={qIdx >= QUESTIONS.length - 1}
            step2Correct={step2Correct}
            canSubmit={canSubmit}
            onSubmit={handleSubmit}
            onNext={handleNext}
          />
        )}
      </div>

      {/* z-index: 200 — Rive 정답 오버레이 */}
      {/* step2Active: step2 정답 완료 시에만 Confetti 마우스 이벤트 허용 */}
      <RiveCorrectOverlay
        step1CanvasRef={step1CanvasRef}
        step2CanvasRef={step2CanvasRef}
        step2Active={step2AnimActive}
      />
    </div>
  );
}
