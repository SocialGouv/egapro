// Setup file for common mocks in representation-equilibree tests
import { vi } from "vitest";

import { nextAuthMock, nextAuthReactMock, repeqFunnelStoreMock } from "./repeq-mocks";

// Configure all common mocks directly
// Mock company action
vi.mock("@globalActions/company", () => ({
  getCompany: vi.fn(),
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => nextAuthReactMock);

// Mock next-auth
vi.mock("next-auth", () => nextAuthMock);

// Mock useRepeqFunnelStore
vi.mock("../useRepeqFunnelStore", () => repeqFunnelStoreMock);
