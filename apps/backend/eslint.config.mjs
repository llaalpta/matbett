import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      'prisma/**',
      '*.config.js',
      '*.config.mjs',
      'prisma/migrations/**',
      'frontend-types/**',
      '*.proposed.example.ts',
      '*.propsed.example.ts',
      'prisma.config.ts',
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
      // TypeScript - Calidad de código
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "TSAsExpression:not(TSAsExpression[typeAnnotation.type='TSConstKeyword']):not(TSAsExpression[typeAnnotation.type='TSConstType']):not(TSAsExpression[typeAnnotation.type='TSTypeReference'][typeAnnotation.typeName.name='const'])",
          message: 'No usar type assertions (solo se permite `as const`).',
        },
      ],
      'unused-imports/no-unused-imports': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // General - Buenas prácticas
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
  {
    files: ['**/*.config.{js,ts,mjs}', 'prisma/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
];
