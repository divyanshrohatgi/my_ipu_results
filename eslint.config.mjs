import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'scripts/**', // test scripts may use console
  ]),
  {
    rules: {
      // Enforce structured logging via lib/logger.ts
      'no-console': ['error', { allow: ['log'] }],
    },
  },
]);

export default eslintConfig;
