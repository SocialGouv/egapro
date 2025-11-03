import { fireEvent, render, screen } from "@testing-library/react";

import EcartsCadres from "../page";

// Mock the store
jest.mock("../../useRepeqFunnelStore", () => ({
  useRepeqFunnelStore: jest.fn(() => ({
    funnel: { year: 2024 },
    saveFunnel: jest.fn(),
    resetFunnel: jest.fn(),
    isEdit: false,
    setIsEdit: jest.fn(),
  })),
  useRepeqFunnelStoreHasHydrated: jest.fn(() => true),
}));

describe("EcartsCadres", () => {
  it("should render correctly", () => {
    render(<EcartsCadres />);

    // Check definition alert
    expect(screen.getByRole("heading", { name: "Définition" })).toBeInTheDocument();
    expect(
      screen.getByText(/Sont considérés comme ayant la qualité de cadre dirigeant/, { exact: false }),
    ).toBeInTheDocument();

    // Check legal article link
    const legalLink = screen.getByRole("link", { name: "Article L3111-2" });
    expect(legalLink).toBeInTheDocument();
    expect(legalLink).toHaveAttribute("href", "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902439/");
    expect(legalLink).toHaveAttribute("target", "_blank");
    expect(legalLink).toHaveAttribute("rel", "nofollow");
  });

  it("should show NumberPairInputs when computable is selected", () => {
    render(<EcartsCadres />);

    // Click on "Oui" radio button
    const ouiRadio = screen.getByLabelText("Oui");
    fireEvent.click(ouiRadio);

    // Check that NumberPairInputs are visible
    expect(screen.getByLabelText("Pourcentage de femmes parmi les cadres dirigeants *")).toBeInTheDocument();
    expect(screen.getByLabelText("Pourcentage d'hommes parmi les cadres dirigeants *")).toBeInTheDocument();

    // Check that Select for non-computable is hidden
    expect(screen.queryByLabelText("Motif de non calculabilité *")).not.toBeInTheDocument();
  });

  it("should show Select when non-computable is selected", () => {
    render(<EcartsCadres />);

    // Click on "Non" radio button
    const nonRadio = screen.getByLabelText("Non");
    fireEvent.click(nonRadio);

    // Check that Select is visible
    expect(screen.getByLabelText("Motif de non calculabilité *")).toBeInTheDocument();

    // Check that NumberPairInputs are hidden
    expect(screen.queryByLabelText("Pourcentage de femmes parmi les cadres dirigeants *")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Pourcentage d'hommes parmi les cadres dirigeants *")).not.toBeInTheDocument();
  });
});
