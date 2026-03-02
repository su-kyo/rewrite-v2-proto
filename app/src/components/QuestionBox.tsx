import { useState } from 'react';
import type { QuestionData, TokenState, DropState } from '@/types';
import Token from './Token';
import Dropdown from './Dropdown';
import ImageModal from './ImageModal';
import Description from './Description';

interface QuestionBoxProps {
  question: QuestionData;
  step: 1 | 2;
  remaining: number;
  // Step 1
  tokenStates: Record<string, TokenState>;
  shakingToken: string | null;
  onTokenClick: (id: string, isCorrect: boolean) => void;
  // Step 2
  drops: Record<string, DropState>;
  openDrop: string | null;
  onDropToggle: (id: string) => void;
  onDropSelect: (id: string, val: string) => void;
}

export default function QuestionBox({
  question,
  step,
  remaining,
  tokenStates,
  shakingToken,
  onTokenClick,
  drops,
  openDrop,
  onDropToggle,
  onDropSelect,
}: QuestionBoxProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* 카드 외부 래퍼 (주황 shadow) */}
      <div className="card-outer">
        {/* 카드 내부 (흰 배경) */}
        <div className="card-inner">
          {/* 설명 바 */}
          <Description step={step} remaining={remaining} />

          {/* 문제 영역 */}
          <div className="question-area">
            {/* 이미지 (있는 경우만) */}
            {question.image && (
              <div
                className="question-image-wrap"
                onClick={() => setModalOpen(true)}
              >
                <img src={question.image} alt="" className="question-image" />
                <div className="question-image-border" />
                <div className="question-image-hint">
                  <span>🔍 크게 보기</span>
                </div>
              </div>
            )}

            {/* 문장 */}
            <div className="sentence">
              {question.parts.map((part, i) => {
                if (part.type === 'plain') {
                  return (
                    <span key={i} className="sentence-plain">
                      {part.text}
                    </span>
                  );
                }

                const id = part.id!;

                if (step === 1) {
                  return (
                    <Token
                      key={id}
                      text={part.text}
                      state={tokenStates[id] ?? 'idle'}
                      isShaking={shakingToken === id}
                      onClick={() => onTokenClick(id, part.isCorrect!)}
                    />
                  );
                }

                // Step 2
                if (part.isCorrect) {
                  const drop = drops[id];
                  if (!drop) return null;
                  const def = question.dropdownDefs[id];
                  const allOptions = [def.defaultValue, ...def.options.map((o) => o.value)];

                  return (
                    <Dropdown
                      key={id}
                      value={drop.value}
                      options={allOptions}
                      isOpen={openDrop === id && drop.phase === 'normal'}
                      isWrong={drop.wrong}
                      phase={drop.phase}
                      onToggle={() => onDropToggle(id)}
                      onSelect={(val) => onDropSelect(id, val)}
                    />
                  );
                }

                // Step 2 — 가짜 선지는 plain 텍스트
                return (
                  <span key={id} className="sentence-plain">
                    {part.text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && question.image && (
        <ImageModal src={question.image} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
