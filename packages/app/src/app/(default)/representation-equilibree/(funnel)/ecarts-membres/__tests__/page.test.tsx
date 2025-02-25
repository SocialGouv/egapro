import { render, screen } from "@testing-library/react";

import EcartsMembres from "../page";

// Mock Form component
jest.mock("../Form", () => ({
  EcartsMembresForm: () => <div data-testid="ecarts-membres-form">Form Mock</div>,
}));

describe("EcartsMembres", () => {
  it("should render correctly", () => {
    render(<EcartsMembres />);

    // Check definition alert
    expect(screen.getByRole("heading", { name: "Définition" })).toBeInTheDocument();
    expect(screen.getByText(/Est considérée comme instance dirigeante/)).toBeInTheDocument();

    // Check legal article link
    const legalLink = screen.getByRole("link", { name: "Article L23-12-1" });
    expect(legalLink).toHaveAttribute("href", "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044566715");
    expect(legalLink).toHaveAttribute("target", "_blank");
    expect(legalLink).toHaveAttribute("rel", "nofollow");

    // Check form is rendered
    expect(screen.getByTestId("ecarts-membres-form")).toBeInTheDocument();
  });
});
