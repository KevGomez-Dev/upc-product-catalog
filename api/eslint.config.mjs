import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**']),
  eslint.configs.recommended,
  {
    files: ['test/**/*.cjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommended],
  },
]);
