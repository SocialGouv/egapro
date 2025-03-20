import { render, screen } from "@testing-library/react";

import RepresentationEquilibree from "../page";

describe("RepresentationEquilibree", () => {
  it("should render correctly", async () => {
    render(await RepresentationEquilibree());

    // Title and subtitle
    expect(screen.getByText("Bienvenue sur")).toBeInTheDocument();
    expect(screen.getByText(/la représentation équilibrée dans les postes de direction/)).toBeInTheDocument();

    // External links
    const lawLink = screen.getByRole("link", { name: "La loi du 24 décembre 2021" });
    expect(lawLink).toBeInTheDocument();
    expect(lawLink).toHaveAttribute("href", "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000044559192");
    expect(lawLink).toHaveAttribute("target", "_blank");
    expect(lawLink).toHaveAttribute("rel", "noopener noreferrer");

    // Important text content
    expect(screen.getByText("entreprises qui emploient au moins 1000 salariés", { exact: false })).toBeInTheDocument();

    // Cards
    expect(screen.getByText("Déclaration des écarts de représentation")).toBeInTheDocument();
    const declareButton = screen.getByRole("link", { name: "Déclarer mes écarts" });
    expect(declareButton).toBeInTheDocument();
    expect(declareButton).toHaveAttribute("href", "/representation-equilibree/assujetti");

    // Help section
    const helpTitle = screen.getByText("Besoin d’aide ?");
    expect(helpTitle).toBeInTheDocument();

    // Help links
    const helpLinks = [
      {
        href: "/aide-proconnect",
      },
      {
        href: "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/",
      },
      {
        href: "https://egapro.travail.gouv.fr/apiv2/public/referents_egalite_professionnelle.xlsx",
      },
    ];

    helpLinks.forEach((link, index) => {
      const element = screen.getAllByRole("link", { name: "cliquez ici" })[index];
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute("href", link.href);
      expect(element).toHaveAttribute("target", "_blank");
    });

    // Timeline sections
    expect(screen.getByText("À compter de 2023")).toBeInTheDocument();
    expect(
      screen.getByText(/les entreprises devront publier et déclarer leurs écarts éventuels/, { exact: false }),
    ).toBeInTheDocument();

    expect(screen.getByText("À compter du 1er mars 2026")).toBeInTheDocument();
    expect(
      screen.getByText(/elles devront atteindre un objectif de 30% de femmes et d’hommes/, { exact: false }),
    ).toBeInTheDocument();

    expect(screen.getByText("À compter du 1er mars 2029")).toBeInTheDocument();
    expect(
      screen.getByText(/elles devront atteindre un objectif de 40% de femmes et d’hommes/, { exact: false }),
    ).toBeInTheDocument();
  });
});
