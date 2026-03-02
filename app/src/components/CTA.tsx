interface CTAProps {
  isLastQuestion: boolean;
  step2Correct: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onNext: () => void;
}

export default function CTA({ isLastQuestion, step2Correct, canSubmit, onSubmit, onNext }: CTAProps) {
  if (step2Correct) {
    return (
      <div className="cta">
        <button className="btn btn-next" onClick={onNext}>
          <span>{isLastQuestion ? '완료' : '다음 문제'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="cta">
      <button
        className="btn btn-submit"
        disabled={!canSubmit}
        onClick={canSubmit ? onSubmit : undefined}
      >
        <span>제출하기</span>
      </button>
    </div>
  );
}
