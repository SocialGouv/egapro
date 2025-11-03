import { render, screen } from "@testing-library/react";

import DeclarantPage from "../page";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = jest.mocked(require("next-auth")).getServerSession;

// Mock auth config
jest.mock("@api/core-domain/infra/auth/config", () => ({
  authConfig: {},
}));

// Mock the store for the Form
jest.mock("../../useRepeqFunnelStore", () => ({
  useRepeqFunnelStore: jest.fn(() => ({
    funnel: { year: 2024 },
    saveFunnel: jest.fn(),
    isEdit: false,
  })),
  useRepeqFunnelStoreHasHydrated: jest.fn(() => true),
}));

describe("DeclarantPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await DeclarantPage();
    expect(result).toBeNull();
  });

  it("should render correctly with session", async () => {
    const session = {
      user: {
        email: "test@example.com",
        firstname: "John",
        lastname: "Doe",
        phoneNumber: "0612345678",
        staff: false,
        companies: [],
        companiesHash: "",
        tokenApiV1: "",
      },
      expires: "",
    };
    mockGetServerSession.mockResolvedValue(session);

    const result = await DeclarantPage();
    expect(result).not.toBeNull();
    render(result!);

    expect(
      screen.getByText(/Les informations déclarant sont préremplies à partir de votre compte ProConnect/, {
        exact: false,
      }),
    ).toBeInTheDocument();

    // Test Form conditions: DeclarantFields should be rendered
    expect(screen.getByLabelText("Prénom du déclarant *")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du déclarant *")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Téléphone du déclarant \*/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Adresse email du déclarant *")).toBeInTheDocument();
  });

  it("should render for staff user", async () => {
    const session = {
      user: {
        email: "staff@example.com",
        firstname: "Jane",
        lastname: "Smith",
        phoneNumber: "0698765432",
        staff: true,
        companies: [],
        companiesHash: "",
        tokenApiV1: "",
      },
      expires: "",
    };
    mockGetServerSession.mockResolvedValue(session);

    const result = await DeclarantPage();
    expect(result).not.toBeNull();
    render(result!);

    expect(
      screen.getByText(/Les informations déclarant sont préremplies à partir de votre compte ProConnect/, {
        exact: false,
      }),
    ).toBeInTheDocument();

    // Test Form conditions: should still show the fields
    expect(screen.getByLabelText("Prénom du déclarant *")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du déclarant *")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Téléphone du déclarant \*/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Adresse email du déclarant *")).toBeInTheDocument();
  });
});
