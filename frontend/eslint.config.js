import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },

  // Base JS recommended
  js.configs.recommended,

  // TypeScript recommended
  ...tseslint.configs.recommended,

  // React Hooks
  {
    plugins: { 'react-hooks': reactHooksPlugin },
    rules:   { ...reactHooksPlugin.configs.recommended.rules },
  },

  // React Refresh
  {
    plugins: { 'react-refresh': reactRefreshPlugin },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // TypeScript overrides
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Prettier (must be last)
  {
    plugins: { prettier: prettierPlugin },
    rules:   { 'prettier/prettier': 'error' },
  },
  prettierConfig,
);
