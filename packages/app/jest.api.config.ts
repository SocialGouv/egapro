import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/**
 * Focused Jest config for API / repository unit tests.
 *
 * Goal: validate infra code (repos, drizzle schema usage) without pulling in
 * browser/UI dependencies.
 */
const config = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.api.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.api.afterEnv.ts"],
  globalTeardown: "<rootDir>/jest.api.teardown.ts",
  testMatch: ["<rootDir>/src/api/**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    "^server-only$": "<rootDir>/__mocks__/server-only.js",
    "(../){0,}design-system/@design-system":
      "<rootDir>/src/design-system/server.ts",
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

// eslint-disable-next-line import/no-default-export
export default createJestConfig(config);
