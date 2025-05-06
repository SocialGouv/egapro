import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";

import Publication from "../page";

// Mock only the router functionality, not the Form component
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

// Mock the zustand store
const mockEndOfPeriod = "2023-12-31";
jest.mock("../../useRepeqFunnelStore", () => ({
  useRepeqFunnelStore: jest.fn(() => ({
    funnel: {
      year: 2023,
      endOfPeriod: mockEndOfPeriod,
    },
    saveFunnel: jest.fn(),
    resetFunnel: jest.fn(),
  })),
  useRepeqFunnelStoreHasHydrated: jest.fn(() => true),
}));

// Mock formatIsoToFr to ensure consistent output in tests
jest.mock("@common/utils/date", () => ({
  formatIsoToFr: jest.fn(date => {
    if (date === mockEndOfPeriod) return "31/12/2023";
    return "Date formatée";
  }),
}));

describe("Publication", () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("should render correctly", () => {
    render(<Publication />);

    // Check that the alert is rendered
    expect(screen.getByRole("heading", { name: "Obligation de transparence" })).toBeInTheDocument();
    expect(
      screen.getByText(/Les écarts de représentation, parmi les cadres dirigeants/, { exact: false }),
    ).toBeInTheDocument();

    // Check that the form is rendered
    expect(screen.getByText("Les champs suivis d'une * sont obligatoires")).toBeInTheDocument();
  });

  it("should have a date input field", () => {
    render(<Publication />);

    const dateInput = screen.getByLabelText(/Date de publication des écarts calculables/, { exact: false });
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute("type", "date");
  });

  it("should disable submit button with invalid date", async () => {
    render(<Publication />);

    const dateInput = screen.getByLabelText(/Date de publication des écarts calculables/, { exact: false });
    await userEvent.type(dateInput, "01/01/20225");
    await userEvent.tab();

    const submitButton = screen.getByRole("button", { name: "Suivant" });
    expect(submitButton).toBeDisabled();
  });

  it("should have radio buttons for website selection", () => {
    render(<Publication />);

    // Check that the radio buttons are rendered
    expect(screen.getByText(/Avez-vous un site Internet pour publier les écarts calculables/)).toBeInTheDocument();

    const ouiRadio = screen.getByLabelText("Oui");
    expect(ouiRadio).toBeInTheDocument();
    expect(ouiRadio).toHaveAttribute("type", "radio");

    const nonRadio = screen.getByLabelText("Non");
    expect(nonRadio).toBeInTheDocument();
    expect(nonRadio).toHaveAttribute("type", "radio");
  });

  it("should have navigation buttons", () => {
    render(<Publication />);

    // Check that the back and next buttons are rendered
    const backButton = screen.getByRole("link", { name: "Précédent" });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute("href", "/representation-equilibree/ecarts-membres");

    const nextButton = screen.getByRole("button", { name: "Suivant" });
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toBeDisabled(); // Initially disabled until valid data is entered
  });
});
