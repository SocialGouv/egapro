import { render, screen } from "@testing-library/react";

import AugmentationEtPromotionsPage from "../page";

// Mock the ClientOnly component
jest.mock("../../../../../../components/utils/ClientOnly", () => ({
  ClientOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the AlertExistingDeclaration component
jest.mock("../../AlertExistingDeclaration", () => ({
  AlertExistingDeclaration: () => <div data-testid="alert-existing">Alert Existing</div>,
}));

// Mock the DeclarationStepper component
jest.mock("../../DeclarationStepper", () => ({
  DeclarationStepper: ({ stepName }: { stepName: string }) => <div data-testid="stepper">{stepName}</div>,
}));

describe("AugmentationEtPromotionsPage", () => {
  it("should render the existing declaration alert", () => {
    render(<AugmentationEtPromotionsPage />);

    expect(screen.getByTestId("alert-existing")).toBeInTheDocument();
  });

  it("should render the stepper with correct step name", () => {
    render(<AugmentationEtPromotionsPage />);

    const stepper = screen.getByTestId("stepper");
    expect(stepper).toHaveTextContent("conges-maternite");
  });

  it("should render all components in the correct order", () => {
    render(<AugmentationEtPromotionsPage />);

    const alertExisting = screen.getByTestId("alert-existing");
    const stepper = screen.getByTestId("stepper");

    expect(alertExisting).toBeInTheDocument();
    expect(stepper).toBeInTheDocument();

    // Verify the order in the DOM
    expect(alertExisting.compareDocumentPosition(stepper)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
