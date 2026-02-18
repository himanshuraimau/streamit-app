// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Prettier formatting as errors
      'prettier/prettier': 'error',

      // TypeScript-specific
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General
      // Console output is legitimate in a Node.js/Express backend (server-side logging).
      // Consider replacing with a structured logger (pino/winston) in the future.
      'no-console': 'off',
      'no-debugger': 'error',

      // Requiring { cause } on every rethrow is impractical for Express backends at this stage.
      'preserve-caught-error': 'warn',

      // Express global namespace augmentation is required for typing req.user/webhookEvent.
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    // Ignore generated/config files
    ignores: [
      'node_modules/**',
      'dist/**',
      'prisma/migrations/**',
      'eslint.config.js',
    ],
  }
);
