import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { vi } from "vitest";

import CommencerPage from "../page";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

const mockGetServerSession = vi.mocked(getServerSession);

// Mock auth config
vi.mock("@api/core-domain/infra/auth/config", () => ({
  authConfig: {},
}));

vi.mock("@common/config", () => {
  const config = {
    api: {
      security: {
        auth: {
          isEmailLogin: false,
        },
      },
    },
    proconnect: {
      manageOrganisationUrl: "https://example.com",
    },
  };
  return {
    config,
  };
});
// Mock the store for the Form
vi.mock("../../useRepeqFunnelStore", () => ({
  useRepeqFunnelStore: vi.fn(() => ({
    funnel: null,
    saveFunnel: vi.fn(),
    resetFunnel: vi.fn(),
    isEdit: false,
    setIsEdit: vi.fn(),
  })),
  useRepeqFunnelClientStore: vi.fn(() => ({
    funnel: null,
    saveFunnel: vi.fn(),
    resetFunnel: vi.fn(),
    isEdit: false,
    setIsEdit: vi.fn(),
  })),
  useRepeqFunnelStoreHasHydrated: vi.fn(() => true),
}));

// Mock actions
vi.mock("../../../actions", () => ({
  getRepresentationEquilibree: vi.fn(),
}));

// Mock global actions
vi.mock("@globalActions/company", () => ({
  getCompany: vi.fn(),
}));

import { config } from "@common/config";

describe("CommencerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await CommencerPage();
    expect(result).toBeNull();
  });

  it("should render alert for no companies with email login", async () => {
    const session = {
      user: {
        email: "test@example.com",
        staff: false,
        companies: [],
        companiesHash: "",
        tokenApiV1: "",
      },
      expires: "",
    };
    mockGetServerSession.mockResolvedValue(session);

    (config as unknown as { api: { security: { auth: { isEmailLogin: boolean } } } }).api.security.auth.isEmailLogin =
      true;

    const result = await CommencerPage();
    expect(result).not.toBeNull();
    render(result!);

    expect(screen.getByText("Aucune entreprise rattachée")).toBeInTheDocument();
    expect(screen.getByText(/faire une demande de rattachement/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "la page de demande de rattachement" })).toHaveAttribute(
      "href",
      "/rattachement",
    );
  });

  it("should render alert for no companies with ProConnect", async () => {
    const session = {
      user: {
        email: "test@example.com",
        staff: false,
        companies: [],
        companiesHash: "",
        tokenApiV1: "",
      },
      expires: "",
    };
    mockGetServerSession.mockResolvedValue(session);

    (config as unknown as { api: { security: { auth: { isEmailLogin: boolean } } } }).api.security.auth.isEmailLogin =
      false;

    const result = await CommencerPage();
    expect(result).not.toBeNull();
    render(result!);

    expect(screen.getByText("Aucune entreprise rattachée")).toBeInTheDocument();
    expect(screen.getByText(/votre espace ProConnect/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "votre espace ProConnect" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("should render form when user has companies", async () => {
    const session = {
      user: {
        email: "test@example.com",
        staff: false,
        siret: "12345678900001",
        entreprise: { siren: "123456789", label: "Test Company" },
        companies: [
          {
            siren: "123456789",
            label: "Test Company",
          },
        ],
        companiesHash: "",
        tokenApiV1: "",
      },
      expires: "",
    };
    mockGetServerSession.mockResolvedValue(session);

    const result = await CommencerPage();
    expect(result).not.toBeNull();
    render(result!);

    expect(
      screen.getByText(/Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise/, { exact: false }),
    ).toBeInTheDocument();

    // Test Form conditions: for non-staff, siren is displayed as text (not a Select)
    expect(screen.getByText("Siren entreprise")).toBeInTheDocument();
    expect(screen.getByText("Test Company")).toBeInTheDocument();

    // Should show YEARS, not REPEQ_ADMIN_YEARS
    expect(
      screen.getByLabelText("Année au titre de laquelle les écarts de représentation sont calculés *"),
    ).toBeInTheDocument();
  });

  it("should render form for staff user", async () => {
    const session = {
      user: {
        email: "staff@example.com",
        staff: true,
        companies: [],
        companiesHash: "",
        tokenApiV1: "",
      },
      expires: "",
    };
    mockGetServerSession.mockResolvedValue(session);

    const result = await CommencerPage();
    expect(result).not.toBeNull();
    render(result!);

    expect(
      screen.getByText(/Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise/, { exact: false }),
    ).toBeInTheDocument();

    // Test Form conditions: should show Input for siren
    expect(screen.getByLabelText("Siren entreprise *")).toBeInTheDocument();

    // Should show REPEQ_ADMIN_YEARS
    expect(
      screen.getByLabelText("Année au titre de laquelle les écarts de représentation sont calculés *"),
    ).toBeInTheDocument();
  });
});
