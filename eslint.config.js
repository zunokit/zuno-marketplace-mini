import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  {
    ignores: [
      "dist/**",
      ".next/**",
      "out/**",
      "public/**",
      "node_modules/**",
      "node_modules/.pnpm/**",
      ".claude/**",
    ],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    rules: {
      // Allow unused vars that start with underscore
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Allow console.log for debugging (commented out in production)
      "no-console": "warn",

      // Prefer const over let when possible
      "prefer-const": "error",

      // No semicolons required (optional preference)
      semi: ["off", "never"],
    },
  }),
];

export default config;
