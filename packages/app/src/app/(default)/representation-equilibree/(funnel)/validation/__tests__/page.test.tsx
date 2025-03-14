import { render, screen } from "@testing-library/react";

// Mock the RecapRepEq component
jest.mock("../RecapRepEq", () => ({
  ValidationRecapRepEq: () => <div data-testid="recap-repeq">Récapitulatif des écarts</div>,
}));

// Import the component after mocking dependencies
import Validation from "../page";

describe("Validation", () => {
  it("should render correctly", () => {
    render(<Validation />);

    // Check introduction text
    expect(screen.getByText(/Vous êtes sur le point de valider la procédure/, { exact: false })).toBeInTheDocument();

    // Check legal article link
    const legalLink = screen.getByRole("link", { name: "article D. 1142-19 du code du travail" });
    expect(legalLink).toBeInTheDocument();
    expect(legalLink).toHaveAttribute("href", "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045669617");
    expect(legalLink).toHaveAttribute("target", "_blank");
    expect(legalLink).toHaveAttribute("rel", "noopener noreferrer");

    // Check instruction text
    expect(
      screen.getByText(/Pour terminer la procédure/, {
        exact: false,
      }),
    ).toBeInTheDocument();

    // Check recap heading
    expect(screen.getByRole("heading", { name: "Récapitulatif des écarts de représentation" })).toBeInTheDocument();

    // Check that the recap component is rendered
    expect(screen.getByTestId("recap-repeq")).toBeInTheDocument();
  });
});
