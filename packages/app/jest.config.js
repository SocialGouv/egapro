const nextJest = require("next/jest");
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./__tests__/tsconfig.json");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  collectCoverage: true,
  coverageProvider: "v8",
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!.eslintrc.js",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!<rootDir>/out/**",
    "!<rootDir>/.next/**",
    "!<rootDir>/*.config.js",
    "!<rootDir>/coverage/**",
  ],
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["<rootDir>/__tests__/**/?(*.)(spec|test).(ts|tsx)"],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/src/" }),
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
