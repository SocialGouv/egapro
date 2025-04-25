// Setup file for common mocks in representation-equilibree tests
import { nextAuthMock, nextAuthReactMock, repeqFunnelStoreMock } from "./repeq-mocks";

// Configure all common mocks directly
// Mock company action
jest.mock("@globalActions/company");

// Mock next-auth/react
jest.mock("next-auth/react", () => nextAuthReactMock);

// Mock next-auth
jest.mock("next-auth", () => nextAuthMock);

// Mock useRepeqFunnelStore
jest.mock("../useRepeqFunnelStore", () => repeqFunnelStoreMock);
