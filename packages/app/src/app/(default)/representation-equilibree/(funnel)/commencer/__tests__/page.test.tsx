import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";

import CommencerPage from "../page";

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
        auth: {
          isEmailLogin: false,
        },
      },
      mailer: {
        host: "smtp.example.com",
        smtp: {
          port: 587,
          login: "user",
          password: "pass",
        },
      },
    },
  },
}));

// Mock mail service
jest.mock("@api/core-domain/infra/mail", () => ({
  globalMailerService: {
    sendMail: jest.fn(),
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
  CommencerForm: () => <div data-testid="commencer-form">Form Mock</div>,
}));

// Mock services
jest.mock("@api/core-domain/infra/services", () => ({
  entrepriseService: {
    search: jest.fn(),
  },
}));

describe("CommencerPage", () => {
  const mockSession = {
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

    const { container } = render((await CommencerPage()) as ReactElement);

    expect(container).toBeEmptyDOMElement();
  });

  it("should show ProConnect warning when user has no companies", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    render((await CommencerPage()) as ReactElement);
    expect(screen.getByRole("heading")).toHaveTextContent("Aucune entreprise rattachée");
    expect(screen.getByText(/votre espace ProConnect/)).toBeInTheDocument();
    expect(screen.getByText(/Une fois la demande validée par ProConnect/)).toBeInTheDocument();
  });

  it("should show email warning when user has no companies and isEmailLogin is true", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    // Override config for email login
    jest.requireMock("@common/config").config.api.security.auth.isEmailLogin = true;

    render((await CommencerPage()) as ReactElement);

    expect(screen.getByRole("heading")).toHaveTextContent("Aucune entreprise rattachée");
    expect(screen.getByText(/la page de demande de rattachement/)).toBeInTheDocument();
    expect(
      screen.getByText(/Une fois la demande validée, vous pourrez continuer votre déclaration\./),
    ).toBeInTheDocument();
  });

  it("should show form when user has companies", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        ...mockSession.user,
        companies: [{ siren: "123456789" }],
      },
    });

    render((await CommencerPage()) as ReactElement);

    expect(screen.getByText(/Si vous souhaitez visualiser ou modifier votre déclaration/)).toBeInTheDocument();
    expect(screen.getByTestId("commencer-form")).toBeInTheDocument();
  });

  it("should show form when user is staff", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        ...mockSession.user,
        staff: true,
      },
    });

    render((await CommencerPage()) as ReactElement);

    expect(screen.getByText(/Si vous souhaitez visualiser ou modifier votre déclaration/)).toBeInTheDocument();
    expect(screen.getByTestId("commencer-form")).toBeInTheDocument();
  });
});
