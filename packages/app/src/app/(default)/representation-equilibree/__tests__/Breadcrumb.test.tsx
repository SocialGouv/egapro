import { render, screen } from "@testing-library/react";
import { useSelectedLayoutSegment } from "next/navigation";

import { RepEqBreadcrumb } from "../Breadcrumb";

// Mock the Next.js navigation hook
jest.mock("next/navigation", () => ({
  useSelectedLayoutSegment: jest.fn(),
}));

const mockUseSelectedLayoutSegment = jest.mocked(useSelectedLayoutSegment);

describe("RepEqBreadcrumb", () => {
  beforeEach(() => {
    mockUseSelectedLayoutSegment.mockClear();
  });

  it("renders only home link when no segment (null)", () => {
    mockUseSelectedLayoutSegment.mockReturnValue(null);

    render(<RepEqBreadcrumb />);

    const homeLink = screen.getByRole("link", { name: "Accueil" });
    expect(homeLink).toHaveAttribute("href", "/");

    // Should not have the representation équilibrée segment link
    expect(screen.queryByRole("link", { name: "Représentation équilibrée" })).not.toBeInTheDocument();

    // Should have the current page label
    expect(screen.getByText("Représentation équilibrée")).toBeInTheDocument();
  });

  it("renders only home link when segment is null", () => {
    mockUseSelectedLayoutSegment.mockReturnValue(null);

    render(<RepEqBreadcrumb />);

    const homeLink = screen.getByRole("link", { name: "Accueil" });
    expect(homeLink).toHaveAttribute("href", "/");

    // Should not have the representation équilibrée segment link
    expect(screen.queryByRole("link", { name: "Représentation équilibrée" })).not.toBeInTheDocument();

    // Should have the current page label
    expect(screen.getByText("Représentation équilibrée")).toBeInTheDocument();
  });

  it("renders breadcrumb segments when segment exists", () => {
    mockUseSelectedLayoutSegment.mockReturnValue("assujetti");

    render(<RepEqBreadcrumb />);

    // Home link
    expect(screen.getByRole("link", { name: "Accueil" })).toHaveAttribute("href", "/");

    // Representation équilibrée link should be present
    const repEqLink = screen.getByRole("link", { name: "Représentation équilibrée" });
    expect(repEqLink).toHaveAttribute("href", "/representation-equilibree");

    // Current page label should be the declaration text
    expect(screen.getByText("Déclarer les écarts éventuels de représentation femmes‑hommes")).toBeInTheDocument();
  });

  it("renders same current page label for any non-null segment", () => {
    const segments = [
      "commencer",
      "declarant",
      "entreprise",
      "periode-reference",
      "ecarts-cadres",
      "ecarts-membres",
      "publication",
      "validation",
    ];

    segments.forEach(segment => {
      mockUseSelectedLayoutSegment.mockReturnValue(segment);

      const { unmount } = render(<RepEqBreadcrumb />);

      expect(screen.getByText("Déclarer les écarts éventuels de représentation femmes‑hommes")).toBeInTheDocument();

      unmount();
    });
  });

  it("conditionally renders segment link based on segment existence", () => {
    // Test with segment
    mockUseSelectedLayoutSegment.mockReturnValue("test");
    const { rerender } = render(<RepEqBreadcrumb />);

    expect(screen.getByRole("link", { name: "Représentation équilibrée" })).toBeInTheDocument();

    // Test without segment
    mockUseSelectedLayoutSegment.mockReturnValue(null);
    rerender(<RepEqBreadcrumb />);

    expect(screen.queryByRole("link", { name: "Représentation équilibrée" })).not.toBeInTheDocument();
  });
});
