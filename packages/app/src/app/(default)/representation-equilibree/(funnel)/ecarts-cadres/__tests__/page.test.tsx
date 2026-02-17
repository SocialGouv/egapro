import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import EcartsCadres from "../page";

// Create stable state objects using vi.hoisted so they are the same reference across re-renders
const stableState = vi.hoisted(() => ({
  funnel: { year: 2024 },
  saveFunnel: vi.fn(),
  resetFunnel: vi.fn(),
  isEdit: false,
  setIsEdit: vi.fn(),
}));

// Mock the store - must handle selector functions from storePicker
vi.mock("../../useRepeqFunnelStore", () => ({
  useRepeqFunnelStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    if (typeof selector === "function") {
      return selector(stableState);
    }
    return stableState;
  }),
  useRepeqFunnelClientStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    if (typeof selector === "function") {
      return selector(stableState);
    }
    return stableState;
  }),
  useRepeqFunnelStoreHasHydrated: vi.fn(() => true),
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
