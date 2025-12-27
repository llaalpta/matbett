import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.extends("prettier"), // Desactiva reglas que conflictan con Prettier
  {
    ignores: [
      "public/**",
      ".next/**",
      "node_modules/**", 
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts"
    ]
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // React - Calidad de código
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",

      // TypeScript - Calidad de código
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",

      // Import/Export - Organización
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

      // General - Buenas prácticas
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",

      // Accessibility - Buenas prácticas
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
