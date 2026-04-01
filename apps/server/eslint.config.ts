import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import importPlugin from 'eslint-plugin-import'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: ['dist', 'node_modules', '__tests__', '*.config.js', '*.config.ts', 'src/types/**/*.d.ts',"src/**/*.test.ts"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,js}'],

    languageOptions: {
      globals: globals.node,
    },

    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
    },

    rules: {
      // ========================
      // 🔥 CODE QUALITY
      // ========================
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': 'error',
      'no-return-await': 'error',

      // ========================
      // 🔥 ERROR PREVENTION
      // ========================
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
      'no-unreachable': 'error',
      'no-duplicate-imports': 'error',

      // ========================
      // 🔥 TYPESCRIPT STRICTNESS
      // ========================
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // ========================
      // 🔥 BEST PRACTICES
      // ========================
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      'object-shorthand': ['error', 'always'],

      // ========================
      // 🔥 IMPORT CLEANLINESS
      // ========================
      'sort-imports': [
        'warn',
        {
          ignoreDeclarationSort: true,
        },
      ],
      'import/no-unresolved': 'off',

      // 🔥 remove unused imports automatically
      'unused-imports/no-unused-imports': 'error',

      // ========================
      // 🔥 SPACING
      // ========================
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],

      // ========================
      // 🔥 SECURITY
      // ========================
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },

  prettier,
])
