// @ts-check
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** @type {import("eslint").Linter.Config[]} */
const base = [
  {
    ignores: ['**/*.d.ts', 'dist/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      // typescript-eslint's `configs` / rule typings lag ESLint 9's `Plugin` from `@eslint/core`;
      // runtime shape is correct — narrow at the boundary for `@ts-check`.
      '@typescript-eslint': /** @type {import('eslint').ESLint.Plugin} */ (/** @type {unknown} */ (tseslint)),
    },
    rules: {
      ...tseslint.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];

export default base;
