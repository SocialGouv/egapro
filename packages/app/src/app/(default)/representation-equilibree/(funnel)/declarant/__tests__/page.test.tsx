import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { vi } from "vitest";

import DeclarantPage from "../page";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

const mockGetServerSession = vi.mocked(getServerSession);

// Mock auth config
vi.mock("@api/core-domain/infra/auth/config", () => ({
  authConfig: {},
}));

// Create stable mock state to avoid infinite re-renders with storePicker
const stableStoreState = vi.hoisted(() => {
  const saveFunnel = () => {};
  const resetFunnel = () => {};
  const setIsEdit = () => {};
  return {
    funnel: { year: 2024 },
    saveFunnel,
    resetFunnel,
    isEdit: false,
    setIsEdit,
  };
});

// Mock the store for the Form — must handle selectors (storePicker calls store(selector))
vi.mock("../../useRepeqFunnelStore", () => ({
  useRepeqFunnelStore: vi.fn((selector?: (state: typeof stableStoreState) => unknown) => {
    if (typeof selector === "function") return selector(stableStoreState);
    return stableStoreState;
  }),
  useRepeqFunnelClientStore: vi.fn((selector?: (state: typeof stableStoreState) => unknown) => {
    if (typeof selector === "function") return selector(stableStoreState);
    return stableStoreState;
  }),
  useRepeqFunnelStoreHasHydrated: vi.fn(() => true),
}));

describe("DeclarantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
