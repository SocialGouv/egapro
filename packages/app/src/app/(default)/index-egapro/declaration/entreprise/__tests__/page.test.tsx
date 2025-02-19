import { render, screen } from "@testing-library/react";

import InformationsEntreprisePage from "../page";

// Mock the AlertExistingDeclaration component
jest.mock("../../AlertExistingDeclaration", () => ({
  AlertExistingDeclaration: () => <div data-testid="alert-existing">Alert Existing</div>,
}));

// Mock the DeclarationStepper component
jest.mock("../../DeclarationStepper", () => ({
  DeclarationStepper: ({ stepName }: { stepName: string }) => <div data-testid="stepper">{stepName}</div>,
}));

// Mock the Alert component from react-dsfr
jest.mock("@codegouvfr/react-dsfr/Alert", () => ({
  __esModule: true,
  default: ({ description }: { description: React.ReactNode }) => (
    <div data-testid="alert-info" role="alert">
      {description}
    </div>
  ),
}));

describe("InformationsEntreprisePage", () => {
  it("should render the existing declaration alert", () => {
    render(<InformationsEntreprisePage />);

    expect(screen.getByTestId("alert-existing")).toBeInTheDocument();
  });

  it("should render the stepper with correct step name", () => {
    render(<InformationsEntreprisePage />);

    const stepper = screen.getByTestId("stepper");
    expect(stepper).toHaveTextContent("entreprise");
  });

  it("should render the information alert with correct text", () => {
    render(<InformationsEntreprisePage />);

    const alert = screen.getByTestId("alert-info");
    expect(alert).toHaveTextContent(/Concernant la tranche d'effectifs assujettis/);
    expect(alert).toHaveTextContent(/articles L.1111-2 et L.1111-3 du code du travail/);
  });

  it("should render all components in the correct order", () => {
    render(<InformationsEntreprisePage />);

    const alertExisting = screen.getByTestId("alert-existing");
    const stepper = screen.getByTestId("stepper");
    const alertInfo = screen.getByTestId("alert-info");

    expect(alertExisting).toBeInTheDocument();
    expect(stepper).toBeInTheDocument();
    expect(alertInfo).toBeInTheDocument();

    // Verify the order in the DOM
    expect(alertExisting.compareDocumentPosition(stepper)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(stepper.compareDocumentPosition(alertInfo)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
