import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";

import CommencerPage, { metadata } from "../page";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock the DeclarationStepper component
jest.mock("../../DeclarationStepper", () => ({
  DeclarationStepper: ({ stepName }: { stepName: string }) => <div data-testid="stepper">{stepName}</div>,
}));

// Mock the CommencerForm component
jest.mock("../CommencerForm", () => ({
  CommencerForm: ({ monCompteProHost }: { monCompteProHost: string }) => (
    <div data-testid="form">Form {monCompteProHost}</div>
  ),
}));

describe("CommencerPage", () => {
  const mockGetServerSession = getServerSession as jest.Mock;

  beforeEach(() => {
    mockGetServerSession.mockReset();
  });

  it("should return null when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const { container } = render((await CommencerPage()) as ReactElement);
    expect(container).toBeEmptyDOMElement();
  });

  it("should show email login alert when no companies and email login", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        email: "test@example.com",
        companies: [],
        staff: false,
      },
    });

    // Override config for email login
    jest.requireMock("@common/config").config.api.security.auth.isEmailLogin = true;

    render((await CommencerPage()) as ReactElement);

    expect(screen.getByText(/Aucune entreprise rattachée/)).toBeInTheDocument();
  });

  it("should show ProConnect alert when no companies and ProConnect login", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        email: "test@example.com",
        companies: [],
        staff: false,
      },
    });

    // Override config for ProConnect login
    jest.requireMock("@common/config").config.api.security.auth.isEmailLogin = false;

    render((await CommencerPage()) as ReactElement);

    expect(screen.getByText(/Aucune entreprise rattachée/)).toBeInTheDocument();
    expect(screen.getByText(/votre espace ProConnect/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://app.moncomptepro.beta.gouv.fr/manage-organizations",
    );
  });

  it("should render form for users with companies", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        email: "test@example.com",
        companies: ["company1"],
        staff: false,
      },
    });

    render((await CommencerPage()) as ReactElement);

    expect(screen.getByTestId("stepper")).toHaveTextContent("commencer");
    expect(screen.getByTestId("form")).toBeInTheDocument();
    expect(screen.getByText(/Si vous déclarez votre index en tant qu'unité économique et sociale/)).toBeInTheDocument();
  });

  it("should render form for staff users even without companies", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        email: "test@example.com",
        companies: [],
        staff: true,
      },
    });

    render((await CommencerPage()) as ReactElement);

    expect(screen.getByTestId("stepper")).toHaveTextContent("commencer");
    expect(screen.getByTestId("form")).toBeInTheDocument();
  });

  it("should have correct metadata", () => {
    expect(metadata.title).toContain("Commencer la déclaration");
    expect(metadata.openGraph.title).toContain("Commencer la déclaration");
  });
});
