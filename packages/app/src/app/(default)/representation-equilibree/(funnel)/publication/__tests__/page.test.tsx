import { render, screen } from "@testing-library/react";

import Publication from "../page";

// Mock Form component
jest.mock("../Form", () => ({
  PublicationForm: () => <div data-testid="publication-form">Form Mock</div>,
}));

describe("Publication", () => {
  it("should render correctly", () => {
    render(<Publication />);

    // Check info alert
    expect(screen.getByRole("heading", { name: "Obligation de transparence" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /es écarts de représentation, parmi les cadres dirigeants et les membres des instances dirigeantes/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/doivent être/)).toBeInTheDocument();
    expect(screen.getByText(/chaque année au plus tard le 1er mars/)).toBeInTheDocument();

    // Check form is rendered
    expect(screen.getByTestId("publication-form")).toBeInTheDocument();
  });
});
