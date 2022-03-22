module.exports = {
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  ignorePatterns: ["node_modules/*", "public/js/tarteaucitron/*", "build/*"],
  extends: [
    "react-app",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:cypress/recommended",
    "plugin:testing-library/react",
    "plugin:jest-dom/recommended",
  ],
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "jsx-a11y/anchor-is-valid": "off",
    "@typescript-eslint/no-unused-vars": ["warn"],
    "@typescript-eslint/ban-ts-comment": "off",
    "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }], // ajout qui autorise les apostrophes dans le JSX.
    "prettier/prettier": [
      "error",
      {
        trailingComma: "all",
        semi: false,
        printWidth: 120,
      },
    ],
  },
}
