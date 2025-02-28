import { render, screen } from "@testing-library/react";

import EcartsCadres from "../page";

// Mock Form component
jest.mock("../Form", () => ({
  EcartsCadresForm: () => <div data-testid="ecarts-cadres-form">Form Mock</div>,
}));

describe("EcartsCadres", () => {
  it("should render correctly", () => {
    render(<EcartsCadres />);

    // Check definition alert
    expect(screen.getByRole("heading", { name: "Définition" })).toBeInTheDocument();
    expect(screen.getByText(/Sont considérés comme ayant la qualité de cadre dirigeant/)).toBeInTheDocument();

    // Check legal article link
    const legalLink = screen.getByRole("link", { name: "Article L3111-2" });
    expect(legalLink).toHaveAttribute("href", "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902439/");
    expect(legalLink).toHaveAttribute("target", "_blank");
    expect(legalLink).toHaveAttribute("rel", "nofollow");

    // Check form is rendered
    expect(screen.getByTestId("ecarts-cadres-form")).toBeInTheDocument();
  });
});
