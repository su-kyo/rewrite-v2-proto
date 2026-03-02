import type { QuestionData } from '@/types';
import imgQ1 from '@/assets/q1-image.webp';

export const QUESTIONS: QuestionData[] = [
  // ─── 문제 1 ─────────────────────────────────────────────────────────────────
  {
    image: imgQ1,
    parts: [
      { type: 'plain',  text: '뉴스 발표는' },
      { type: 'token',  id: 't1', text: '진행',    isCorrect: false },
      { type: 'plain',  text: '순서에 맞게 준비해야 해요.' },
      { type: 'plain',  text: '뉴스 내용은' },
      { type: 'token',  id: 't2', text: '과학자',  isCorrect: true },
      { type: 'plain',  text: '가' },
      { type: 'token',  id: 't3', text: '추리한 것', isCorrect: true },
      { type: 'plain',  text: '을' },
      { type: 'token',  id: 't4', text: '보도',    isCorrect: false },
      { type: 'plain',  text: '하는 것이에요.' },
    ],
    dropdownDefs: {
      t2: {
        defaultValue: '과학자',
        options: [
          { value: '검사',  isCorrect: false },
          { value: '기자',  isCorrect: true  },
        ],
      },
      t3: {
        defaultValue: '추리한 것',
        options: [
          { value: '연구한 것', isCorrect: false },
          { value: '취재한 것', isCorrect: true  },
        ],
      },
    },
  },

  // ─── 문제 2 ─────────────────────────────────────────────────────────────────
  {
    parts: [
      { type: 'plain', text: '주장은' },
      { type: 'token', id: 't1', text: '글쓴이',       isCorrect: false },
      { type: 'plain', text: '의' },
      { type: 'token', id: 't2', text: '상상이나 허풍', isCorrect: true  },
      { type: 'plain', text: '을' },
      { type: 'token', id: 't3', text: '나타내는 것',   isCorrect: false },
      { type: 'plain', text: '입니다.' },
    ],
    dropdownDefs: {
      t2: {
        defaultValue: '상상이나 허풍',
        options: [
          { value: '사실',       isCorrect: false },
          { value: '의견이나 생각', isCorrect: true  },
        ],
      },
    },
  },

  // ─── 문제 3 ─────────────────────────────────────────────────────────────────
  {
    parts: [
      { type: 'plain', text: '수를' },
      { type: 'token', id: 't1', text: '제시', isCorrect: false },
      { type: 'plain', text: '할 때에는' },
      { type: 'token', id: 't2', text: '큰',   isCorrect: true  },
      { type: 'plain', text: '숫자를' },
      { type: 'token', id: 't3', text: '사용', isCorrect: false },
      { type: 'plain', text: '해야 합니다.' },
    ],
    dropdownDefs: {
      t2: {
        defaultValue: '큰',
        options: [
          { value: '어림잡은', isCorrect: false },
          { value: '정확한',   isCorrect: true  },
        ],
      },
    },
  },
];
