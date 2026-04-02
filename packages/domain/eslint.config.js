// @ts-check
import base from '@dayparty/eslint-config';
import tsParser from '@typescript-eslint/parser';

export default [
  ...base,
  {
    files: ['src/**/*.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: false,
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
