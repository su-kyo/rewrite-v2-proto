// ─── Token 관련 ────────────────────────────────────────────────────────────────

/** Step1 토큰의 상태 */
export type TokenState = 'idle' | 'found' | 'missed';

/** Step2 드롭다운의 상태 */
export type DropPhase = 'normal' | 'correct' | 'plain';

// ─── 문항 데이터 구조 ──────────────────────────────────────────────────────────

/** 문장 구성 요소 (plain 텍스트 or 클릭 가능한 token) */
export interface SentencePart {
  type: 'plain' | 'token';
  text: string;
  /** token일 때 필수 */
  id?: string;
  /** 실제 정답 여부 (token만 해당) */
  isCorrect?: boolean;
}

/** Step2 드롭다운 선택지 */
export interface DropdownOption {
  value: string;
  isCorrect: boolean;
}

/** 토큰 ID를 키로 갖는 드롭다운 정의 */
export interface DropdownDef {
  defaultValue: string;
  options: DropdownOption[];
}

/** 하나의 문항 전체 데이터 */
export interface QuestionData {
  image?: string;
  parts: SentencePart[];
  /** Step1에서 correct 처리된 토큰 ID → 드롭다운 정의 */
  dropdownDefs: Record<string, DropdownDef>;
}

// ─── 런타임 상태 ────────────────────────────────────────────────────────────────

/** Step2 드롭다운 하나의 런타임 상태 */
export interface DropState {
  value: string;
  phase: DropPhase;
  /** 한 번이라도 클릭(선택)했는지 */
  interacted: boolean;
  /** 오답 처리 중(shake) */
  wrong: boolean;
}
