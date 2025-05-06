// Import setup file to configure all common mocks
import "../../__test-utils__/setup-repeq-mocks";

// Import dependencies
import { type ServerActionResponse } from "@common/utils/next";
import { getCompany } from "@globalActions/company";
import { type CompanyErrorCodes } from "@globalActions/companyErrorCodes";
import { render, screen, waitFor } from "@testing-library/react";

import {
  foreignCompanyMockData,
  frenchCompanyMockData,
  setupCompanyMock,
  setupFunnelStoreMock,
} from "../../__test-utils__/repeq-mocks";
import Entreprise from "../page";

describe("Entreprise Page", () => {
  const useRepeqFunnelStoreMock = jest.requireMock("../../useRepeqFunnelStore").useRepeqFunnelStore;
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render correctly when company is french", async () => {
    // Use helper functions to set up mocks with explicit options
    setupFunnelStoreMock(useRepeqFunnelStoreMock, { isForeignCompany: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getCompanyMock = getCompany as jest.Mock<Promise<ServerActionResponse<any, CompanyErrorCodes>>, [string]>;
    setupCompanyMock(getCompanyMock, { isForeignCompany: false });
    render(<Entreprise />);
    await waitFor(() => {
      expect(screen.getByText(/Informations de l'entreprise déclarante/, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(frenchCompanyMockData.siren)).toBeInTheDocument();
    });
  });

  it("should render correctly when company is foreign", async () => {
    // Use helper functions to set up mocks with explicit options
    setupFunnelStoreMock(useRepeqFunnelStoreMock, { isForeignCompany: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getCompanyMock = getCompany as jest.Mock<Promise<ServerActionResponse<any, CompanyErrorCodes>>, [string]>;
    setupCompanyMock(getCompanyMock, { isForeignCompany: true });
    render(<Entreprise />);

    await waitFor(() => {
      expect(screen.getByText(/Informations de l'entreprise déclarante/, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(foreignCompanyMockData.siren)).toBeInTheDocument();
    });
  });
});
