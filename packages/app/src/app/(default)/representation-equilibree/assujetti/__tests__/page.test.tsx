import { fireEvent, render, screen } from "@testing-library/react";

import AssujettiPage from "../page";

describe("AssujettiPage", () => {
  it("should render correctly", async () => {
    render(await AssujettiPage());

    // Check title
    expect(screen.getByRole("heading", { name: "Êtes-vous assujetti ?" })).toBeInTheDocument();

    // Check description text
    expect(
      screen.getByText(/Les entreprises qui emploient au moins 1000 salariés pour le troisième exercice consécutif/, {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it("should show 'Suivant' button when 'Oui' is selected", async () => {
    render(await AssujettiPage());

    // Find and click the "Oui" radio button
    const ouiRadio = screen.getByLabelText(
      "Oui, mon entreprise emploie au moins 1000 salariés pour le troisième exercice consécutif",
    );
    fireEvent.click(ouiRadio);

    // Check that the "Suivant" button is displayed
    const suivantButton = screen.getByRole("link", { name: "Suivant" });
    expect(suivantButton).toBeInTheDocument();
    expect(suivantButton).toHaveAttribute("href", "/representation-equilibree/commencer");
  });

  it("should show CallOut with return button when 'Non' is selected", async () => {
    render(await AssujettiPage());

    // Find and click the "Non" radio button
    const nonRadio = screen.getByLabelText(
      "Non, mon entreprise n'emploie pas au moins 1000 salariés pour le troisième exercice consécutif",
    );
    fireEvent.click(nonRadio);

    // Check that the CallOut with return button is displayed
    expect(screen.getByText(/Votre entreprise n'est pas concernée/, { exact: false })).toBeInTheDocument();

    const returnButton = screen.getByRole("link", { name: "Retour à la page d'accueil" });
    expect(returnButton).toBeInTheDocument();
    expect(returnButton).toHaveAttribute("href", "/representation-equilibree");
  });
});
