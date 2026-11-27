import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**']),
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommended],
  },
]);
