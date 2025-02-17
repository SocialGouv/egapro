import { fireEvent, render, screen } from "@testing-library/react";

import { AssujettiForm } from "../Form";

// Mock useId to have a consistent ID for testing
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useId: () => "test-id",
}));

// Mock fr.cx from @codegouvfr/react-dsfr
jest.mock("@codegouvfr/react-dsfr", () => ({
  fr: {
    cx: jest.fn(className => className),
  },
}));

describe("<AssujettiForm />", () => {
  const defaultProps = {
    title: "Test Title",
  };

  beforeEach(() => {
    // Reset document body before each test
    document.body.innerHTML = "";
  });

  it("should render radio buttons with correct labels", () => {
    render(<AssujettiForm {...defaultProps} />);

    expect(
      screen.getByLabelText("Oui, mon entreprise ou UES a un effectif assujetti d'au moins 50 salariés au 1er mars"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Non, mon entreprise ou UES n'a pas un effectif assujetti d'au moins 50 salariés au 1er mars",
      ),
    ).toBeInTheDocument();
  });

  it("should set initial checked state on mount", () => {
    render(<AssujettiForm {...defaultProps} />);

    const radioOui = screen.getByLabelText(
      "Oui, mon entreprise ou UES a un effectif assujetti d'au moins 50 salariés au 1er mars",
    ) as HTMLInputElement;

    expect(radioOui.checked).toBe(true);
    expect(radioOui.getAttribute("data-default-checked")).toBe("test-id");
  });

  it("should show 'Suivant' button when 'Oui' is selected", () => {
    render(<AssujettiForm {...defaultProps} />);

    const button = screen.getByRole("link", { name: /suivant/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", "/index-egapro/declaration/commencer");
  });

  it("should show CallOut with return home button when 'Non' is selected", () => {
    render(<AssujettiForm {...defaultProps} />);

    // Click 'Non' radio button
    fireEvent.click(
      screen.getByLabelText(
        "Non, mon entreprise ou UES n'a pas un effectif assujetti d'au moins 50 salariés au 1er mars",
      ),
    );

    // Check if CallOut message is displayed
    expect(
      screen.getByText(
        "Votre entreprise ou UES n'est pas concernée, vous ne devez pas déclarer à l'administration l'index de l'égalité professionnelle.",
      ),
    ).toBeInTheDocument();

    // Check if return home button is displayed with correct href
    expect(screen.getByRole("link", { name: "Retour à la page d'accueil" })).toHaveAttribute("href", "/");
  });

  it("should toggle between 'Suivant' button and CallOut when switching radio selection", () => {
    render(<AssujettiForm {...defaultProps} />);

    // Initially should show 'Suivant' button
    expect(screen.getByRole("link", { name: /suivant/i })).toBeInTheDocument();

    // Click 'Non' radio
    fireEvent.click(
      screen.getByLabelText(
        "Non, mon entreprise ou UES n'a pas un effectif assujetti d'au moins 50 salariés au 1er mars",
      ),
    );

    // Should show CallOut
    expect(screen.getByRole("link", { name: "Retour à la page d'accueil" })).toBeInTheDocument();

    // Click 'Oui' radio
    fireEvent.click(
      screen.getByLabelText("Oui, mon entreprise ou UES a un effectif assujetti d'au moins 50 salariés au 1er mars"),
    );

    // Should show 'Suivant' button again
    expect(screen.getByRole("link", { name: /suivant/i })).toBeInTheDocument();
  });

  it("should render the form with noValidate attribute", () => {
    render(<AssujettiForm {...defaultProps} />);

    const form = screen.getByRole("form");
    expect(form).toHaveAttribute("novalidate");
  });

  it("should render the legend with sr-only class", () => {
    render(<AssujettiForm {...defaultProps} />);

    const legend = screen.getByText(defaultProps.title);
    expect(legend).toHaveClass("fr-sr-only");
  });
});
