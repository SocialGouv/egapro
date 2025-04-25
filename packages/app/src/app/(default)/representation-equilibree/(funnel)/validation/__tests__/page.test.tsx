// Import setup file to configure all common mocks
import "../../__test-utils__/setup-repeq-mocks";

// Import dependencies
import { type ServerActionResponse } from "@common/utils/next";
import { getCompany } from "@globalActions/company";
import { type CompanyErrorCodes } from "@globalActions/companyErrorCodes";
import { render, screen } from "@testing-library/react";

import {
  foreignCompanyFunnelState,
  frenchCompanyFunnelState,
  setupCompanyMock,
  setupFunnelStoreMock,
} from "../../__test-utils__/repeq-mocks";
import Validation from "../page";

describe("Validation", () => {
  const useRepeqFunnelStoreMock = jest.requireMock("../../useRepeqFunnelStore").useRepeqFunnelStore;
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render correctly when company is french", () => {
    // Use helper functions to set up mocks with explicit options
    setupFunnelStoreMock(useRepeqFunnelStoreMock, { isForeignCompany: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getCompanyMock = getCompany as jest.Mock<Promise<ServerActionResponse<any, CompanyErrorCodes>>, [string]>;
    setupCompanyMock(getCompanyMock, { isForeignCompany: false });
    render(<Validation />);

    expect(screen.getByText(/Récapitulatif des écarts de représentation/, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(frenchCompanyFunnelState.funnel.siren)).toBeInTheDocument();
  });

  it("should render correctly when company is foreign", () => {
    // Use helper functions to set up mocks with explicit options
    setupFunnelStoreMock(useRepeqFunnelStoreMock, { isForeignCompany: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getCompanyMock = getCompany as jest.Mock<Promise<ServerActionResponse<any, CompanyErrorCodes>>, [string]>;
    setupCompanyMock(getCompanyMock, { isForeignCompany: true });
    render(<Validation />);

    expect(screen.getByText(/Récapitulatif des écarts de représentation/, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(foreignCompanyFunnelState.funnel.siren)).toBeInTheDocument();
  });
});
