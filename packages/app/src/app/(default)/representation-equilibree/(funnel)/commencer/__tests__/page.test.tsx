import { render, screen } from "@testing-library/react";

import CommencerPage from "../page";

// Mock next-auth
const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

// Mock auth config
jest.mock("@api/core-domain/infra/auth/config", () => ({
  authConfig: {},
}));

// Mock config
const mockConfig = {
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
jest.mock("@common/config", () => ({
  config: mockConfig,
}));

// Mock the store for the Form
jest.mock("../../useRepeqFunnelStore", () => ({
  useRepeqFunnelStore: jest.fn(() => ({
    funnel: null,
    saveFunnel: jest.fn(),
    resetFunnel: jest.fn(),
    isEdit: false,
    setIsEdit: jest.fn(),
  })),
  useRepeqFunnelStoreHasHydrated: jest.fn(() => true),
}));

// Mock actions
jest.mock("../../../actions", () => ({
  getRepresentationEquilibree: jest.fn(),
}));

// Mock global actions
jest.mock("@globalActions/company", () => ({
  getCompany: jest.fn(),
}));

describe("CommencerPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    mockConfig.api.security.auth.isEmailLogin = true;

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

    mockConfig.api.security.auth.isEmailLogin = false;

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
      screen.getByText("Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise"),
    ).toBeInTheDocument();

    // Test Form conditions: should show Select for siren
    expect(screen.getByLabelText("Numéro Siren de l’entreprise *")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "123456789 (Test Company)" })).toBeInTheDocument();

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
      screen.getByText("Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise"),
    ).toBeInTheDocument();

    // Test Form conditions: should show Input for siren
    expect(screen.getByLabelText("Siren entreprise (staff) *")).toBeInTheDocument();

    // Should show REPEQ_ADMIN_YEARS
    expect(
      screen.getByLabelText("Année au titre de laquelle les écarts de représentation sont calculés *"),
    ).toBeInTheDocument();
  });
});
