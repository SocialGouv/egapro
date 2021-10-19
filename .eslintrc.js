module.exports = {
    ignorePatterns: ["node_modules/*", "!.prettierrc.js"],
    env: {
        browser: true,
        node: true,
        es2020: true,
        "jest/globals": true,
    },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:jsx-a11y/recommended",
        "plugin:prettier/recommended",
    ],
    plugins: ["react", "@typescript-eslint", "jest", "eslint-plugin-prettier"],
    rules: {
        "react/prop-types": "off",
        "react/react-in-jsx-scope": "off",
        "jsx-a11y/anchor-is-valid": "off",
    },
    settings: {
        react: {
            version: "detect",
        },
    },
    extends: ["plugin:@typescript-eslint/recommended"],
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx"],
            parser: "@typescript-eslint/parser",


            rules: {
                "@typescript-eslint/no-unused-vars": ["error"],
                "prettier/prettier": [
                    "error",
                    {
                        trailingComma: "all",
                        printWidth: 120
                    }
                ],
            },
        },
    ],
}
