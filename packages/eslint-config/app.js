// @ts-check
import base from './index.js';

/** @type {import("eslint").Linter.Config[]} */
const app = [
  ...base,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Apps may use `any` in specific circumstances (e.g., 3rd-party interop)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

export default app;
