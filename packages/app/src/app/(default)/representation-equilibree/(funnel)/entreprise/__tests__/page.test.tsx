// Import setup file to configure all common mocks
import "../../__test-utils__/setup-repeq-mocks";

// Import dependencies
import { getServerSession } from "next-auth";
import { render, screen, waitFor } from "@testing-library/react";
import { type Mock, vi } from "vitest";

import {
  foreignCompanyMockData,
  frenchCompanyMockData,
  setupFunnelStoreMock,
} from "../../__test-utils__/repeq-mocks";
import { useRepeqFunnelStore } from "../../useRepeqFunnelStore";
import Entreprise from "../page";

describe("Entreprise Page", () => {
  const useRepeqFunnelStoreMock = vi.mocked(useRepeqFunnelStore);
  const getServerSessionMock = vi.mocked(getServerSession);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render correctly when company is french", async () => {
    // Setup funnel store with matching siren
    setupFunnelStoreMock(useRepeqFunnelStoreMock as unknown as Mock, { isForeignCompany: false });

    // Override getServerSession to return session with entreprise matching funnel siren
    getServerSessionMock.mockResolvedValue({
      expires: "",
      user: {
        email: "test@test.com",
        staff: false,
        entreprise: {
          ...frenchCompanyMockData,
          siren: frenchCompanyMockData.siren,
        },
      },
    } as any);

    const result = await Entreprise();
    render(result);
    await waitFor(() => {
      expect(screen.getByText(/Informations de l'entreprise déclarante/, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(frenchCompanyMockData.siren)).toBeInTheDocument();
    });
  });

  it("should render correctly when company is foreign", async () => {
    // Setup funnel store with matching siren
    setupFunnelStoreMock(useRepeqFunnelStoreMock as unknown as Mock, { isForeignCompany: true });

    // Override getServerSession to return session with entreprise matching funnel siren
    getServerSessionMock.mockResolvedValue({
      expires: "",
      user: {
        email: "test@test.com",
        staff: false,
        entreprise: {
          ...foreignCompanyMockData,
          siren: foreignCompanyMockData.siren,
        },
      },
    } as any);

    const result = await Entreprise();
    render(result);

    await waitFor(() => {
      expect(screen.getByText(/Informations de l'entreprise déclarante/, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(foreignCompanyMockData.siren)).toBeInTheDocument();
    });
  });
});
