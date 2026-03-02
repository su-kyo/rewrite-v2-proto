interface ProgressProps {
  current: number; // 0-based index
  total: number;
}

export default function Progress({ current, total }: ProgressProps) {
  return (
    <div className="progress-bar">
      <div className="progress-circles">
        {Array.from({ length: total }, (_, i) => {
          const isDone    = i < current;
          const isCurrent = i === current;
          return (
            <span
              key={i}
              className={`progress-dot ${isDone ? 'done' : isCurrent ? 'current' : 'yet'}`}
            />
          );
        })}
      </div>
      <div className="progress-count">
        <strong>{current + 1}</strong>
        <span>/</span>
        <span>{total}</span>
      </div>
    </div>
  );
}
