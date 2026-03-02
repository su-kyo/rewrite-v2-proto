import { useState } from 'react';
import type { TokenState } from '@/types';

interface TokenProps {
  text: string;
  state: TokenState;
  isShaking: boolean;
  onClick: () => void;
}

export default function Token({ text, state, isShaking, onClick }: TokenProps) {
  const [hovered, setHovered] = useState(false);

  const isClickable = state === 'idle';

  const className = [
    'token',
    state,
    isShaking ? 'shake' : '',
    isClickable && hovered ? 'hover' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={className}
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={() => isClickable && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {text}
    </span>
  );
}
