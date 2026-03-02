interface DescriptionProps {
  step: 1 | 2;
  remaining: number;
}

export default function Description({ step, remaining }: DescriptionProps) {
  return (
    <div className="description-bar">
      {step === 1 ? (
        <p>
          어색한 표현을 찾아 클릭해 보세요.{' '}
          <strong>{remaining}</strong>개 남아 있어요.
        </p>
      ) : (
        <p>어색한 부분을 자연스럽게 고쳐 보세요!</p>
      )}
    </div>
  );
}
