// Setup file for common mocks in representation-equilibree tests
import { nextAuthMock, nextAuthReactMock, repeqFunnelStoreMock } from "./repeq-mocks";

// Setup function to configure all common mocks
export const setupCommonMocks = () => {
  // Mock company action
  jest.mock("@globalActions/company");

  // Mock next-auth/react
  jest.mock("next-auth/react", () => nextAuthReactMock);

  // Mock next-auth
  jest.mock("next-auth", () => nextAuthMock);

  // Mock useRepeqFunnelStore
  jest.mock("../useRepeqFunnelStore", () => repeqFunnelStoreMock);
};

// Call the setup function to configure all mocks
setupCommonMocks();
