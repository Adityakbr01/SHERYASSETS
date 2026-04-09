import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: ['.next', 'node_modules', 'dist',"build","docs","coverage"],
  },

  // Base JS
  js.configs.recommended,

  // TypeScript
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,jsx}'],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      // ========================
      // 🔥 NEXT.JS RULES
      // ========================
      '@next/next/no-html-link-for-pages': 'off',

      // ========================
      // 🔥 REACT RULES
      // ========================
      'react/react-in-jsx-scope': 'off', // Next.js me needed nahi
      'react/jsx-uses-react': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ========================
      // 🔥 CODE QUALITY
      // ========================
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': 'error',

      // ========================
      // 🔥 ERROR PREVENTION
      // ========================
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'no-undef': 'off',
      'no-unreachable': 'error',
      'no-duplicate-imports': 'off',
      'import/no-duplicates': 'error',

      // ========================
      // 🔥 TYPESCRIPT
      // ========================
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ========================
      // 🔥 IMPORTS
      // ========================
      'sort-imports': [
        'warn',
        {
          ignoreDeclarationSort: true,
        },
      ],
      'import/no-unresolved': 'off',
      'unused-imports/no-unused-imports': 'error',

      // ========================
      // 🔥 SPACING
      // ========================
      'no-multiple-empty-lines': [
        'error',
        { max: 1, maxEOF: 0, maxBOF: 0 },
      ],
      'padding-line-between-statements': [
  'error',
  { blankLine: 'never', prev: '*', next: '*' }
],

      // ========================
      // 🔥 SECURITY
      // ========================
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },

  // Disable formatting conflicts
  prettier,
])