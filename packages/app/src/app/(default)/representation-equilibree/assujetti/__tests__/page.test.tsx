import { render, screen } from "@testing-library/react";

import AssujettiPage from "../page";

// Mock the Form component
jest.mock("../Form", () => ({
  AssujettiForm: ({ title }: { title: string }) => <div data-testid="assujetti-form">{title}</div>,
}));

describe("AssujettiPage", () => {
  it("should render correctly", async () => {
    render(await AssujettiPage());

    // Check title
    const title = "Êtes-vous assujetti ?";
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();

    // Check explanatory text
    expect(
      screen.getByText(/Les entreprises qui emploient au moins 1000 salariés pour le troisième exercice consécutif/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/doivent calculer, publier et déclarer chaque année/, { exact: false }),
    ).toBeInTheDocument();

    // Check form is rendered with correct title
    const form = screen.getByTestId("assujetti-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveTextContent(title);
  });
});
