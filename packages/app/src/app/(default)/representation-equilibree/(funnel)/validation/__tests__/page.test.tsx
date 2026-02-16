// Import setup file to configure all common mocks
import "../../__test-utils__/setup-repeq-mocks";

// Import dependencies
import { type ServerActionResponse } from "@common/utils/next";
import { getCompany } from "@globalActions/company";
import { type CompanyErrorCodes } from "@globalActions/companyErrorCodes";
import { render, screen } from "@testing-library/react";
import { type Mock, vi } from "vitest";

import { setupCompanyMock, setupFunnelStoreMock } from "../../__test-utils__/repeq-mocks";
import { useRepeqFunnelStore } from "../../useRepeqFunnelStore";
import Validation from "../page";

describe("Validation", () => {
  const useRepeqFunnelStoreMock = vi.mocked(useRepeqFunnelStore);
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should render correctly when company is french", async () => {
    // Use helper functions to set up mocks with explicit options
    setupFunnelStoreMock(useRepeqFunnelStoreMock as unknown as Mock, { isForeignCompany: false });

    const getCompanyMock = getCompany as Mock;
    setupCompanyMock(getCompanyMock, { isForeignCompany: false });

    // Validation is an async server component - await it first
    const result = await Validation();
    render(result);

    expect(screen.getByText(/Récapitulatif des écarts de représentation/, { exact: false })).toBeInTheDocument();
  });

  it("should render correctly when company is foreign", async () => {
    // Use helper functions to set up mocks with explicit options
    setupFunnelStoreMock(useRepeqFunnelStoreMock as unknown as Mock, { isForeignCompany: true });

    const getCompanyMock = getCompany as Mock;
    setupCompanyMock(getCompanyMock, { isForeignCompany: true });

    // Validation is an async server component - await it first
    const result = await Validation();
    render(result);

    expect(screen.getByText(/Récapitulatif des écarts de représentation/, { exact: false })).toBeInTheDocument();
  });
});
