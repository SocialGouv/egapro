import { render, screen } from "@testing-library/react";

import InformationsEntreprise from "../page";

// Mock Form component
jest.mock("../Form", () => ({
  EntrepriseForm: () => <div data-testid="entreprise-form">Form Mock</div>,
}));

describe("InformationsEntreprise", () => {
  it("should render form", () => {
    render(<InformationsEntreprise />);

    expect(screen.getByTestId("entreprise-form")).toBeInTheDocument();
  });
});
