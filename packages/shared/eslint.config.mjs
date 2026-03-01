import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
    ],
  },
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // Strict Typing Enforcement
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'unused-imports/no-unused-imports': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "TSAsExpression:not(TSAsExpression[typeAnnotation.type='TSConstKeyword']):not(TSAsExpression[typeAnnotation.type='TSConstType']):not(TSAsExpression[typeAnnotation.type='TSTypeReference'][typeAnnotation.typeName.name='const'])",
          message: 'No usar type assertions (solo se permite `as const`).',
        },
      ],
      
      // General Best Practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
];
