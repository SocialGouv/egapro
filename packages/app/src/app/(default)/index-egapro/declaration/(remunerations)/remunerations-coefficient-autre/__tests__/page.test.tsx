import { render, screen } from "@testing-library/react";

import RemunerationCoefficientAutrePage from "../page";

// Mock the DeclarationStepper component
jest.mock("../../../DeclarationStepper", () => ({
  DeclarationStepper: ({ stepName }: { stepName: string }) => <div data-testid="stepper">{stepName}</div>,
}));

// Mock the RemunerationGenericForm component
jest.mock("../../RemunerationGenericForm", () => ({
  RemunerationGenericForm: ({ mode }: { mode: string }) => <div data-testid="remuneration-form">{mode}</div>,
}));

describe("RemunerationCoefficientAutrePage", () => {
  it("should render the stepper with correct step name", () => {
    render(<RemunerationCoefficientAutrePage />);

    const stepper = screen.getByTestId("stepper");
    expect(stepper).toHaveTextContent("remunerations-coefficient-autre");
  });

  it("should render the required fields notice", () => {
    render(<RemunerationCoefficientAutrePage />);

    expect(screen.getByText(/Les champs suivis d'une \* sont obligatoires/)).toBeInTheDocument();
  });

  it("should render the title with required indicator", () => {
    render(<RemunerationCoefficientAutrePage />);

    const title = screen.getByRole("heading", {
      name: /Ecarts de rémunération par niveau ou coefficient et tranche d'âge en % \*/,
    });
    expect(title).toBeInTheDocument();
  });

  it("should render the explanation text", () => {
    render(<RemunerationCoefficientAutrePage />);

    expect(
      screen.getByText(/Il faut saisir les écarts de rémunération en % avant application du seuil de pertinence/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/uniquement pour les niveaux ou coefficients et tranches d'âge pris en compte pour le calcul/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Un écart positif est à la faveur des hommes et un écart négatif est à la faveur des femmes/),
    ).toBeInTheDocument();
  });

  it("should render the remuneration form with correct mode", () => {
    render(<RemunerationCoefficientAutrePage />);

    const form = screen.getByTestId("remuneration-form");
    expect(form).toHaveTextContent("niveau_autre");
  });
});
