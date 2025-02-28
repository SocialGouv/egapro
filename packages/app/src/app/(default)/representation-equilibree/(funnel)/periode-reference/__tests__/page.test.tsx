import { render, screen } from "@testing-library/react";

import PeriodeReference from "../page";

// Mock Form component
jest.mock("../Form", () => ({
  PeriodeReferenceForm: () => <div data-testid="periode-reference-form">Form Mock</div>,
}));

describe("PeriodeReference", () => {
  it("should render form", () => {
    render(<PeriodeReference />);

    expect(screen.getByTestId("periode-reference-form")).toBeInTheDocument();
  });
});
