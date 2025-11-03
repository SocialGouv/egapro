import { render, screen } from "@testing-library/react";

import RepresentationEquilibree from "../page";

describe("RepresentationEquilibree Page", () => {
  it("renders the main heading with correct structure", async () => {
    render(await RepresentationEquilibree());

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Bienvenue sur");
    expect(heading).toHaveTextContent("la représentation équilibrée dans les postes de direction");
  });

  it("renders the law link with correct attributes", async () => {
    render(await RepresentationEquilibree());

    const link = screen.getByRole("link", { name: "La loi du 24 décembre 2021" });
    expect(link).toHaveAttribute("href", "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000044559192");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the declaration card with button", async () => {
    render(await RepresentationEquilibree());

    expect(screen.getByText("Déclaration des écarts de représentation")).toBeInTheDocument();
    const button = screen.getByRole("link", { name: "Déclarer mes écarts" });
    expect(button).toHaveAttribute("href", "/representation-equilibree/assujetti");
  });

  it("renders all help links with correct hrefs", async () => {
    render(await RepresentationEquilibree());

    const helpLinks = screen.getAllByRole("link", { name: "cliquez ici" });
    expect(helpLinks).toHaveLength(3);

    expect(helpLinks[0]).toHaveAttribute("href", "/aide-proconnect");
    expect(helpLinks[1]).toHaveAttribute(
      "href",
      "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/",
    );
    expect(helpLinks[2]).toHaveAttribute(
      "href",
      "https://egapro.travail.gouv.fr/apiv2/public/referents_egalite_professionnelle.xlsx",
    );
  });

  it("renders timeline information with all three periods", async () => {
    render(await RepresentationEquilibree());

    expect(screen.getByText("À compter de 2023")).toBeInTheDocument();
    expect(screen.getByText("À compter du 1er mars 2026")).toBeInTheDocument();
    expect(screen.getByText("À compter du 1er mars 2029")).toBeInTheDocument();
  });

  it("renders the correct number of timeline items", async () => {
    render(await RepresentationEquilibree());

    // Check that we have the three timeline items with their content
    const timelineItems = screen.getAllByText(/À compter/);
    expect(timelineItems).toHaveLength(3);
  });

  it("renders enterprise size requirement text", async () => {
    render(await RepresentationEquilibree());

    expect(screen.getByText(/entreprises qui emploient au moins 1000 salariés/)).toBeInTheDocument();
  });

  it("renders annual deadline text", async () => {
    render(await RepresentationEquilibree());

    expect(screen.getByText(/chaque année au plus tard le 1er mars/)).toBeInTheDocument();
  });
});
