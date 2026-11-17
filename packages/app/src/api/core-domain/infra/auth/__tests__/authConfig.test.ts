/**
 * @jest-environment node
 */
jest.mock("@api/core-domain/infra/companies-store", () => ({
  companiesUtils: { getCompaniesFromRedis: jest.fn(), hashCompanies: jest.fn() },
}));
jest.mock("@api/core-domain/repo", () => ({ ownershipRepo: {} }));
jest.mock("@api/utils/pino", () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { authConfig } from "../config";

describe("authConfig", () => {
  it("exposes ProConnect as the only sign-in provider", () => {
    const providers = authConfig.providers as Array<{ id?: string }>;

    expect(providers.map(provider => provider.id)).toEqual(["proconnect"]);
  });
});
