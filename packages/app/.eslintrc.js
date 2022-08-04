module.exports = {
  env: {
    browser: true,
    node: true,
    es2020: true,
    "jest/globals": true,
  },
  extends: [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
    // "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:testing-library/react",
    "plugin:jest-dom/recommended",
  ],
  plugins: ["jest"],
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error", // Vérifie les règles des Hooks
    "react-hooks/exhaustive-deps": "warn", // Vérifie les tableaux de dépendances
    "jsx-a11y/anchor-is-valid": "off",
    // "@typescript-eslint/no-unused-vars": [
    //   "warn"
    // ],
    // "@typescript-eslint/ban-ts-comment": "off", // TODO : à supprimer ?
    "react/no-unescaped-entities": [
      "error",
      {
        forbid: [">", "}"],
      },
    ], // ajout qui autorise les apostrophes dans le JSX.
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
