/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  reportUnusedDisableDirectives: true,
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  extends: ["eslint:recommended", "next/core-web-vitals", "prettier"],
  plugins: ["prettier", "unused-imports"],
  ignorePatterns: ["!.storybook", "!**/.*.js?(x)", "node_modules"],
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error", // Vérifie les règles des Hooks
    "react-hooks/exhaustive-deps": "warn", // Vérifie les tableaux de dépendances
    "react/no-unescaped-entities": [
      "error",
      {
        forbid: [">", "}"],
      },
    ],
    "jsx-a11y/anchor-is-valid": "off",
    "no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
    "import/order": [
      "warn",
      {
        alphabetize: {
          order: "asc",
        },
      },
    ],
    "import/no-default-export": "error",
    "import/no-extraneous-dependencies": "off",
    "import/no-internal-modules": "off",
    "prettier/prettier": [
      "error",
      {
        tabWidth: 2,
        trailingComma: "all",
        printWidth: 120,
        singleQuote: false,
        parser: "typescript",
        arrowParens: "avoid",
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.ts?(x)"],
      extends: ["plugin:@typescript-eslint/eslint-recommended", "plugin:@typescript-eslint/recommended"],
      plugins: ["@typescript-eslint", "typescript-sort-keys"],
      rules: {
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": [
          "error",
          {
            default: "array-simple",
          },
        ],
        "@typescript-eslint/ban-ts-comment": "error",
        "@typescript-eslint/no-unused-vars": "off",
        "typescript-sort-keys/interface": "error",
        "typescript-sort-keys/string-enum": "error",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/explicit-member-accessibility": [
          "error",
          {
            accessibility: "explicit",
            overrides: {
              accessors: "no-public",
              constructors: "no-public",
            },
          },
        ],
        "@typescript-eslint/member-delimiter-style": [
          "off",
          {
            multiline: {
              delimiter: "none",
              requireLast: true,
            },
            singleline: {
              delimiter: "semi",
              requireLast: false,
            },
          },
        ],
        "@typescript-eslint/consistent-type-imports": [
          "error",
          {
            prefer: "type-imports",
          },
        ],
        "@typescript-eslint/sort-type-union-intersection-members": "warn",
      },
    },
    {
      files: ["src/pages/**/*.ts?(x)"],
      rules: {
        "import/no-default-export": "off",
      },
    },
    {
      files: ["__stories__/**/*.tsx"],
      extends: ["plugin:storybook/recommended"],
      rules: {
        "import/no-default-export": "off",
      },
      parserOptions: {
        project: ["__stories__/tsconfig.json"],
        sourceType: "module",
      },
      settings: {
        "import/resolver": {
          typescript: {
            alwaysTryTypes: true,
            project: ["__stories__/tsconfig.json"],
          },
        },
      },
    },
    {
      files: ["__tests__/*.ts?(x)"],
      extends: ["plugin:testing-library/react", "plugin:jest-dom/recommended"],
      plugins: ["jest"],
      env: {
        jest: true,
        "jest/globals": true,
      },
      parserOptions: {
        project: ["__tests__/tsconfig.json"],
        sourceType: "module",
      },
      settings: {
        "import/resolver": {
          typescript: {
            alwaysTryTypes: true,
            project: ["__tests__/tsconfig.json"],
          },
        },
      },
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
};

module.exports = config;