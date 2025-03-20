import { render, screen } from "@testing-library/react";

import Home from "../page";

// Mock the CSS module
jest.mock("../index.module.css", () => ({
  hero: "hero-class",
}));

describe("<Home />", () => {
  it("should render the home page", async () => {
    render(await Home());

    // Check for the main heading
    const heading = screen.getByText("Bienvenue sur Egapro");
    expect(heading).toBeInTheDocument();
  });

  it("should render information about index calculation", async () => {
    render(await Home());

    const text = screen.getByText(
      /Toutes les entreprises d’au moins 50 salariés doivent calculer et publier leur Index/,
    );
    expect(text).toBeInTheDocument();
  });

  it("should render information about representation", async () => {
    render(await Home());

    const text = screen.getByText(
      /Les entreprises qui emploient au moins 1 000 salariés pour le troisième exercice consécutif/,
    );
    expect(text).toBeInTheDocument();
  });

  it("should render cards with correct titles", async () => {
    render(await Home());

    const indexTitle = screen.getByText("Index de l'égalité professionnelle femmes‑hommes");
    expect(indexTitle).toBeInTheDocument();

    const representationTitle = screen.getByText("Représentation équilibrée femmes‑hommes");
    expect(representationTitle).toBeInTheDocument();
  });

  it("should render buttons with correct links", async () => {
    render(await Home());

    const calculateButton = screen.getByRole("link", { name: /Calculer - Déclarer mon Index/i });
    expect(calculateButton).toHaveAttribute("href", "/index-egapro");

    const consultIndexButton = screen.getByRole("link", { name: /Consulter l'Index/i });
    expect(consultIndexButton).toHaveAttribute("href", "/index-egapro/recherche");

    const declareButton = screen.getByRole("link", { name: /Déclarer mes Écarts/i });
    expect(declareButton).toHaveAttribute("href", "/representation-equilibree");

    const consultRepresentationButton = screen.getByRole("link", { name: /Consulter les Écarts/i });
    expect(consultRepresentationButton).toHaveAttribute("href", "/representation-equilibree/recherche");
  });
});
