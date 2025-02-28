import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";

import DeclarantPage from "../page";

interface SessionUser {
  companies: Array<{ siren: string }>;
  email: string;
  staff: boolean;
}

interface Session {
  user: SessionUser;
}

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock config
jest.mock("@common/config", () => ({
  config: {
    api: {
      security: {
        moncomptepro: {
          appTest: false,
        },
      },
    },
  },
}));

// Mock auth config
jest.mock("@api/core-domain/infra/auth/config", () => ({
  authConfig: {
    providers: [],
  },
}));

// Mock Form component
jest.mock("../Form", () => ({
  DeclarantForm: ({ session }: { session: Session }) => (
    <div data-testid="declarant-form">Form Mock with email: {session.user.email}</div>
  ),
}));

describe("DeclarantPage", () => {
  const mockSession: Session = {
    user: {
      email: "user@example.com",
      companies: [],
      staff: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing when no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { container } = render((await DeclarantPage()) as ReactElement);

    expect(container).toBeEmptyDOMElement();
  });

  it("should show info alert and form when user is connected", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    render((await DeclarantPage()) as ReactElement);

    // Check info alert
    expect(screen.getByText(/Les informations déclarant sont préremplies/)).toBeInTheDocument();
    expect(screen.getByText(/votre profil ProConnect/)).toBeInTheDocument();

    // Check form is rendered with session
    const form = screen.getByTestId("declarant-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveTextContent(mockSession.user.email);
  });

  it("should show sandbox URL when in test mode", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    jest.requireMock("@common/config").config.api.security.moncomptepro.appTest = true;

    render((await DeclarantPage()) as ReactElement);

    const proConnectLink = screen.getByRole("link", { name: /votre profil ProConnect/ });
    expect(proConnectLink).toHaveAttribute("href", "https://identite-sandbox.proconnect.gouv.fr/personal-information");
  });

  it("should show production URL when not in test mode", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    jest.requireMock("@common/config").config.api.security.moncomptepro.appTest = false;

    render((await DeclarantPage()) as ReactElement);

    const proConnectLink = screen.getByRole("link", { name: /votre profil ProConnect/ });
    expect(proConnectLink).toHaveAttribute("href", "https://identite.proconnect.gouv.fr/personal-information");
  });
});
