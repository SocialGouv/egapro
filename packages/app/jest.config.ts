import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/__tests__/**/*?(*.)+(test|spec).[jt]s?(x)"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/cypress/"],
  testTimeout: 20000,
  // Add transformIgnorePatterns to handle ESM modules in node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!(\\.pnpm/.+/node_modules/)?(next|next-auth|@next|jose|openid-client|uuid|@panva|preact|@babel|@swc|@codegouvfr|react-dsfr|tsafe)/)",
  ],
  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!*.{js,ts}",
    "!jest.setup.js",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/__tests__/**",
    "!**/cypress/**",
  ],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "(../){0,}design-system/@design-system": "<rootDir>/src/design-system/server.ts",
    "@components/utils/(.*)$": "<rootDir>/src/components/utils/$1",
    "@components/RHF/(.*)$": "<rootDir>/src/components/RHF/$1",
    "@common/(.*)$": "<rootDir>/src/common/$1",
    "@api/(.*)$": "<rootDir>/src/api/$1",
    "@services/(.*)$": "<rootDir>/src/services/$1",
    "@design-system/utils/(.*)$": "<rootDir>/src/design-system/utils/$1",
    "@design-system/hooks/(.*)$": "<rootDir>/src/design-system/hooks/$1",
    "@public/(.*)$": "<rootDir>/src/public/$1",
    "@globalActions/(.*)$": "<rootDir>/src/app/_globalActions/$1",
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
// eslint-disable-next-line import/no-default-export
export default createJestConfig(config);
