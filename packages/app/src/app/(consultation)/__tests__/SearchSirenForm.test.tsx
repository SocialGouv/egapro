import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { type Mock, vi } from "vitest";

import { SearchSirenForm } from "../SearchSirenForm";

// Mock the next/navigation module
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("SearchSirenForm", () => {
  // Setup mock for useRouter
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it("should not display the clear button when query is empty", () => {
    // Render the component with empty search params
    render(<SearchSirenForm searchParams={{}} />);

    // Try to find the clear button by its aria-label
    const clearButton = screen.queryByLabelText("Effacer la recherche");

    // Assert that the button is not in the document
    expect(clearButton).not.toBeInTheDocument();
  });

  it("should display the clear button when query has a value", () => {
    // Render the component with a query in search params
    render(<SearchSirenForm searchParams={{ query: "test company" }} />);

    // Find the clear button by its aria-label
    const clearButton = screen.getByLabelText("Effacer la recherche");

    // Assert that the button is in the document
    expect(clearButton).toBeInTheDocument();
  });

  it("should clear the query when the clear button is clicked", async () => {
    // Render the component with a query in search params
    render(<SearchSirenForm searchParams={{ query: "test company" }} />);

    // Find the clear button by its aria-label
    const clearButton = screen.getByLabelText("Effacer la recherche");

    // Find the query input by its ID
    const queryInput = screen.getByTitle("Saisissez le nom ou le Siren d'une entreprise déclarante");

    // Verify the input has the initial value
    expect(queryInput).toHaveValue("test company");

    // Click the clear button
    fireEvent.click(clearButton);

    // Verify the input value is cleared
    expect(queryInput).toHaveValue("");
  });

  it("should maintain other search params when clearing the query", () => {
    // Render the component with multiple search params
    render(
      <SearchSirenForm
        searchParams={{
          query: "test company",
          regionCode: "84", // Auvergne-Rhône-Alpes
          nafSection: "A", // Agriculture
        }}
      />,
    );

    // Find the clear button by its aria-label
    const clearButton = screen.getByLabelText("Effacer la recherche");

    // Click the clear button
    fireEvent.click(clearButton);

    // Find all comboboxes and check their values
    const comboboxes = screen.getAllByRole("combobox");

    // Find the region select by checking for the option with Auvergne-Rhône-Alpes
    const regionSelect = comboboxes.find(
      select => select.querySelector('option[value="84"]')?.textContent === "Auvergne-Rhône-Alpes",
    );
    expect(regionSelect).toHaveValue("84");

    // Find the NAF section select by checking for the option with Agriculture
    const nafSelect = comboboxes.find(
      select => select.querySelector('option[value="A"]')?.textContent?.includes("Agriculture"),
    );
    expect(nafSelect).toHaveValue("A");
  });
});
