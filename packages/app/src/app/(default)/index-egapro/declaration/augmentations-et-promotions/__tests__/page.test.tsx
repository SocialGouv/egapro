import { render, screen } from "@testing-library/react";

import AugmentationEtPromotionsPage from "../page";

// Mock the ClientOnly component to render children directly
jest.mock("@components/utils/ClientOnly", () => ({
  ClientOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the DeclarationStepper component
jest.mock("../../DeclarationStepper", () => ({
  DeclarationStepper: ({ stepName }: { stepName: string }) => <div data-testid="stepper">{stepName}</div>,
}));

// Mock the AlertExistingDeclaration component
jest.mock("../../AlertExistingDeclaration", () => ({
  AlertExistingDeclaration: () => <div data-testid="alert">Alert</div>,
}));

// Mock the AugmentationEtPromotionsForm component
jest.mock("../AugmentationsEtPromotionsForm", () => ({
  AugmentationEtPromotionsForm: () => <div data-testid="form">Form</div>,
}));

describe("AugmentationEtPromotionsPage", () => {
  it("should render the stepper with correct step name", () => {
    render(<AugmentationEtPromotionsPage />);

    const stepper = screen.getByTestId("stepper");
    expect(stepper).toHaveTextContent("augmentations-et-promotions");
  });

  it("should render the alert", () => {
    render(<AugmentationEtPromotionsPage />);

    expect(screen.getByTestId("alert")).toBeInTheDocument();
  });

  it("should render the form", () => {
    render(<AugmentationEtPromotionsPage />);

    expect(screen.getByTestId("form")).toBeInTheDocument();
  });

  it("should render all components in the correct order", () => {
    render(<AugmentationEtPromotionsPage />);

    const elements = screen.getAllByTestId(/alert|stepper|form/);
    expect(elements).toHaveLength(3);
    expect(elements[0]).toHaveAttribute("data-testid", "alert");
    expect(elements[1]).toHaveAttribute("data-testid", "stepper");
    expect(elements[2]).toHaveAttribute("data-testid", "form");
  });
});
