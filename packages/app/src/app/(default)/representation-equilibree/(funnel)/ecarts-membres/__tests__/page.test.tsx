import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import EcartsMembres from "../page";

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

  it("should show NumberPairInputs when computable is selected", async () => {
    render(<EcartsMembres />);

    // Click on "Oui" radio button
    const ouiRadio = screen.getByLabelText("Oui");
    await userEvent.click(ouiRadio);

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
