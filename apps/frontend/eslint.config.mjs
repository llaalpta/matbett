import { dirname } from "path";
import { fileURLToPath } from "url";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  {
    ignores: [
      "public/**",
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "src/utils/calculate.ts",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  nextPlugin.flatConfig.coreWebVitals,
  prettier,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
      "react-hooks": reactHooks,
      react,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      // React - Calidad de codigo
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",

      // TypeScript - Calidad de codigo
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "unused-imports/no-unused-imports": "warn",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TSAsExpression:not(TSAsExpression[typeAnnotation.type='TSConstKeyword']):not(TSAsExpression[typeAnnotation.type='TSConstType']):not(TSAsExpression[typeAnnotation.type='TSTypeReference'][typeAnnotation.typeName.name='const'])",
          message: "No usar type assertions (solo se permite `as const`).",
        },
      ],

      // Import/Export - Organizacion
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // General - Buenas practicas
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],

      // Accessibility - Buenas practicas
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "error",
    },
  },
  {
    files: ["**/*.config.{js,ts,mjs}"],
    rules: {
      "no-console": "off",
    },
  },
];

export default eslintConfig;
