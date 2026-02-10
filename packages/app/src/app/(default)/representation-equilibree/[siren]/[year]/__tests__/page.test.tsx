import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { type NextServerPageProps } from "@common/utils/next";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";

import RepEqPage from "../page";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

// Mock config
jest.mock("@common/config", () => ({
  config: {
    api: {
      security: {},
    },
  },
}));

// Mock auth config
jest.mock("@api/core-domain/infra/auth/config", () => ({
  authConfig: {
    providers: [],
  },
}));

// Mock repo and useCase
const mockExecute = jest.fn();
jest.mock("@api/core-domain/repo", () => ({
  representationEquilibreeRepo: {},
}));
jest.mock(
  "@api/core-domain/useCases/GetRepresentationEquilibreeBySirenAndYear",
  () => ({
    GetRepresentationEquilibreeBySirenAndYear: jest
      .fn()
      .mockImplementation(() => ({
        execute: mockExecute,
      })),
    GetRepresentationEquilibreeBySirenAndYearError: class extends Error {},
  }),
);

// Mock DetailRepEq component
jest.mock("../../../Recap", () => ({
  DetailRepEq: ({
    repEq,
    publicMode,
  }: {
    publicMode: boolean;
    repEq: RepresentationEquilibreeDTO;
  }) => (
    <div data-testid="detail-rep-eq">
      Detail Mock - Public: {publicMode.toString()} - Siren: {repEq.siren}
    </div>
  ),
}));

// Mock EditButton component
jest.mock("../EditButton", () => ({
  EditButton: ({ repEq }: { repEq: RepresentationEquilibreeDTO }) => (
    <button type="button" data-testid="edit-button">
      Edit Mock - Siren: {repEq.siren}
    </button>
  ),
}));

describe("RepEqPage", () => {
  const mockRepEq: RepresentationEquilibreeDTO = {
    siren: "123456789",
    year: 2024,
    declaredAt: "2024-01-01T00:00:00.000Z",
    modifiedAt: "2024-01-01T00:00:00.000Z",
    lastname: "Doe",
    firstname: "John",
    phoneNumber: "0123456789",
    email: "john.doe@example.com",
    gdpr: true,
    endOfPeriod: "2024-12-31",
    executiveWomenPercent: 40,
    executiveMenPercent: 60,
    memberWomenPercent: 45,
    memberMenPercent: 55,
    company: {
      address: "1 rue de la Paix",
      city: "Paris",
      countryCode: "FR",
      nafCode: "47.11F",
      name: "Test Company",
      postalCode: "75001",
      region: "11",
    },
  };

  const mockSession = {
    user: {
      email: "user@example.com",
      companies: [],
      staff: false,
    },
  };

  const defaultProps: NextServerPageProps<"siren" | "year"> = {
    params: Promise.resolve({ siren: "123456789", year: "2024" }),
    searchParams: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call notFound when no data is found", async () => {
    mockExecute.mockResolvedValue(null);

    await RepEqPage(defaultProps);

    expect(notFound).toHaveBeenCalled();
  });

  it("should show error alert when useCase throws error", async () => {
    mockExecute.mockRejectedValue(new Error("Unexpected error"));

    render((await RepEqPage(defaultProps)) as ReactElement);

    expect(
      screen.getByRole("heading", { name: "Erreur inattendue" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Une erreur inattendue est survenue."),
    ).toBeInTheDocument();
  });

  it("should show public view when no session", async () => {
    mockExecute.mockResolvedValue(mockRepEq);
    (getServerSession as jest.Mock).mockResolvedValue(null);

    render((await RepEqPage(defaultProps)) as ReactElement);

    expect(
      screen.getByText(/Récapitulatif en accès libre/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("detail-rep-eq")).toHaveTextContent(
      "Public: true",
    );
    expect(screen.queryByTestId("edit-button")).not.toBeInTheDocument();
  });

  it("should show owner view when user has matching siren", async () => {
    mockExecute.mockResolvedValue(mockRepEq);
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        ...mockSession.user,
        companies: [{ siren: "123456789" }],
      },
    });

    render((await RepEqPage(defaultProps)) as ReactElement);

    expect(
      screen.getByText(/Cette déclaration a été validée et transmise/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("detail-rep-eq")).toHaveTextContent(
      "Public: false",
    );
    expect(screen.getByTestId("edit-button")).toBeInTheDocument();
  });

  it("should show warning when user has no matching siren", async () => {
    mockExecute.mockResolvedValue({
      ...mockRepEq,
      declaredAt: "2050-01-01T00:00:00.000Z",
    });
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        email: "user@example.com",
        companies: [{ siren: "123456788" }],
        staff: false,
      },
    });

    render((await RepEqPage(defaultProps)) as ReactElement);

    expect(
      screen.getByText(/Compte non rattaché au Siren/),
    ).toBeInTheDocument();
    expect(screen.getByText(/votre espace ProConnect/)).toBeInTheDocument();
    expect(screen.queryByTestId("edit-button")).not.toBeInTheDocument();
  });

  it("should show staff view when user is staff", async () => {
    mockExecute.mockResolvedValue(mockRepEq);
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        ...mockSession.user,
        staff: true,
      },
    });

    render((await RepEqPage(defaultProps)) as ReactElement);

    expect(
      screen.getByText(/Cette déclaration a été validée et transmise/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("detail-rep-eq")).toHaveTextContent(
      "Public: false",
    );
    expect(screen.getByTestId("edit-button")).toBeInTheDocument();
  });
});
