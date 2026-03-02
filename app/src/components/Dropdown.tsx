import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DropPhase } from '@/types';

interface DropdownProps {
  value: string;
  options: string[];
  isOpen: boolean;
  isWrong: boolean;
  phase: DropPhase;
  onToggle: () => void;
  onSelect: (val: string) => void;
}

export default function Dropdown({
  value,
  options,
  isOpen,
  isWrong,
  phase,
  onToggle,
  onSelect,
}: DropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);

  // 메뉴 위치 (portal 용)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  // plain 전환 후 CSS transition 완료 시점에 진짜 <span>으로 교체
  const [swappedToText, setSwappedToText] = useState(false);

  useEffect(() => {
    if (phase === 'plain') {
      const t = setTimeout(() => setSwappedToText(true), 480);
      return () => clearTimeout(t);
    }
    setSwappedToText(false);
  }, [phase]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
    }
  }, [isOpen]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        onToggle();
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [isOpen, onToggle]);

  // plain → text 교체 완료
  if (swappedToText) {
    return <span className="dropdown-plain-text">{value}</span>;
  }

  const isNormal  = phase === 'normal';
  const isCorrect = phase === 'correct';
  const isPlain   = phase === 'plain';

  const menu =
    isOpen && menuPos && isNormal
      ? createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu"
            style={{ top: menuPos.top, left: menuPos.left, minWidth: menuPos.minWidth }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                className={`dropdown-option${opt === value ? ' selected' : ''}`}
                onClick={() => onSelect(opt)}
              >
                {opt}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="dropdown-wrapper">
      <button
        ref={triggerRef}
        className={[
          'dropdown-trigger',
          isCorrect ? 'correct' : '',
          isPlain   ? 'plain'   : '',
          isWrong && isNormal ? 'wrong shake' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={isNormal ? (e) => { e.stopPropagation(); onToggle(); } : undefined}
        disabled={!isNormal}
      >
        <span className={`dropdown-text${isPlain ? ' settling' : ''}`}>{value}</span>

        {/* 아래 화살표 — plain 시 사라짐 */}
        <span className={`dropdown-chevron${isPlain ? ' hidden' : ''}`}>
          <svg
            width="14"
            height="9"
            viewBox="0 0 15.27 8.82"
            fill="none"
            className={isOpen ? 'rotated' : ''}
          >
            <path
              d="M1.68 1.68L7.63 7.14L13.59 1.68"
              strokeWidth="3.36"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {menu}
    </div>
  );
}
