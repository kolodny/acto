import eslint from '@eslint/js';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import vitest from '@vitest/eslint-plugin';
import n from 'eslint-plugin-n';
import * as regexp from 'eslint-plugin-regexp';
import yml from 'eslint-plugin-yml';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'coverage*',
      'lib',
      'node_modules',
      'pnpm-lock.yaml',
      '**/*.snap',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  eslint.configs.recommended,
  ...yml.configs['flat/recommended'],
  ...yml.configs['flat/prettier'],
  comments.recommended,
  n.configs['flat/recommended'],
  regexp.configs['flat/recommended'],
  {
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.config.*s'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Stylistic concerns that don't interfere with Prettier
      'logical-assignment-operators': [
        'error',
        'always',
        { enforceForIfStatements: true },
      ],
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'operator-assignment': 'error',
    },
  },
  {
    extends: [tseslint.configs.disableTypeChecked],
    files: ['**/*.md/*.ts'],
    rules: {
      'n/no-missing-import': ['error', { allowModules: ['acto'] }],
    },
  },
  {
    files: ['**/*.test.*'],
    extends: [vitest.configs.recommended],
    rules: {
      // These on-by-default rules aren't useful in test files.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    files: ['**/*.{yml,yaml}'],
    rules: {
      'yml/file-extension': ['error', { extension: 'yml' }],
      'yml/sort-keys': [
        'error',
        {
          order: { type: 'asc' },
          pathPattern: '^.*$',
        },
      ],
      'yml/sort-sequence-values': [
        'error',
        {
          order: { type: 'asc' },
          pathPattern: '^.*$',
        },
      ],
    },
  },
);
