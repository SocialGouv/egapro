import { render, screen } from "@testing-library/react";

import EcartsMembres from "../page";

describe("EcartsMembres", () => {
  it("should render correctly", () => {
    render(<EcartsMembres />);

    // Check definition alert
    expect(screen.getByRole("heading", { name: "Définition" })).toBeInTheDocument();
    expect(screen.getByText(/Est considérée comme instance dirigeante/, { exact: false })).toBeInTheDocument();

    // Check legal article link
    const legalLink = screen.getByRole("link", { name: "Article L23-12-1" });
    expect(legalLink).toBeInTheDocument();
    expect(legalLink).toHaveAttribute("href", "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044566715");
    expect(legalLink).toHaveAttribute("target", "_blank");
    expect(legalLink).toHaveAttribute("rel", "nofollow");
  });
});
