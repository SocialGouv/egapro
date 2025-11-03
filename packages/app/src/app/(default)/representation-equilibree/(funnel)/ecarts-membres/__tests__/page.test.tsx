import { fireEvent, render, screen } from "@testing-library/react";

import EcartsMembres from "../page";

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

  it("should show NumberPairInputs when computable is selected", () => {
    render(<EcartsMembres />);

    // Click on "Oui" radio button
    const ouiRadio = screen.getByLabelText("Oui");
    fireEvent.click(ouiRadio);

    // Check that NumberPairInputs are visible
    expect(
      screen.getByLabelText("Pourcentage de femmes parmi les membres des instances dirigeantes *"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Pourcentage d'hommes parmi les membres des instances dirigeantes *"),
    ).toBeInTheDocument();

    // Check that Select for non-computable is hidden
    expect(screen.queryByLabelText("Motif de non calculabilité *")).not.toBeInTheDocument();
  });

  it("should show Select when non-computable is selected", () => {
    render(<EcartsMembres />);

    // Click on "Non" radio button
    const nonRadio = screen.getByLabelText("Non");
    fireEvent.click(nonRadio);

    // Check that Select is visible
    expect(screen.getByLabelText("Motif de non calculabilité *")).toBeInTheDocument();

    // Check that NumberPairInputs are hidden
    expect(
      screen.queryByLabelText("Pourcentage de femmes parmi les membres des instances dirigeantes *"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Pourcentage d'hommes parmi les membres des instances dirigeantes *"),
    ).not.toBeInTheDocument();
  });
});
