import type { QuestionData } from '@/types';
import imgQ1 from '@/assets/q1-image.webp';

export const QUESTIONS: QuestionData[] = [
  // ─── 문제 1 ─────────────────────────────────────────────────────────────────
  {
    image: imgQ1,
    parts: [
      { type: 'plain',  text: '여행을 떠나기 전에는' },
      { type: 'token',  id: 't1', text: '필요한 물건', isCorrect: false },
      { type: 'plain',  text: '을' },
      { type: 'token',  id: 't2', text: '나중에',     isCorrect: true },
      { type: 'plain',  text: '챙겨야 해요.' },
      { type: 'plain',  text: '가방에' },
      { type: 'token',  id: 't3', text: '여벌 옷과 세면도구', isCorrect: false },
      { type: 'plain',  text: '를' },
      { type: 'token',  id: 't4', text: '빼고',       isCorrect: true },
      { type: 'plain',  text: '떠나요.' },
    ],
    dropdownDefs: {
      t2: {
        defaultValue: '나중에',
        options: [
          { value: '늦게', isCorrect: false },
          { value: '미리', isCorrect: true  },
        ],
      },
      t4: {
        defaultValue: '빼고',
        options: [
          { value: '숨기고', isCorrect: false },
          { value: '넣고',   isCorrect: true  },
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
