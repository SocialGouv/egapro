import { render, screen, within } from "@testing-library/react";

import PrivacyPolicy from "../page";

describe("PrivacyPolicy", () => {
  it("should render correctly", async () => {
    render(await PrivacyPolicy());

    // Title
    expect(screen.getByRole("heading", { level: 1, name: "Politique de confidentialité" })).toBeInTheDocument();

    // Important content
    expect(
      screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === "p" &&
          content.includes("La plateforme Index Egapro est sous la responsabilité de la Direction générale du travail")
        );
      }),
    ).toBeInTheDocument();

    // Lists
    const personalDataList = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === "p" &&
        content.includes("Index Egapro traite les données à caractère personnel suivantes")
      );
    }).nextElementSibling as HTMLElement;
    expect(within(personalDataList).getByText(/Nom, prénom, adresse e-mail/)).toBeInTheDocument();

    // Tables
    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(2);

    // First table - Data retention
    const retentionTable = tables[0];
    expect(within(retentionTable).getByText("Catégorie de données")).toBeInTheDocument();
    expect(within(retentionTable).getByText("Durée de conservation")).toBeInTheDocument();
    expect(within(retentionTable).getByText("Données des utilisateurs des Index Egapro")).toBeInTheDocument();

    // Second table - Subcontractors
    const subcontractorsTable = tables[1];
    const subcontractorHeaders = ["Sous-traitant", "Traitement réalisé", "Pays destinataire", "Garanties"];
    subcontractorHeaders.forEach(header => {
      expect(within(subcontractorsTable).getByText(header)).toBeInTheDocument();
    });
    expect(within(subcontractorsTable).getByText("OVH")).toBeInTheDocument();
    expect(within(subcontractorsTable).getByText("Hébergement")).toBeInTheDocument();
    expect(within(subcontractorsTable).getByText("France")).toBeInTheDocument();

    // Links
    const emailLink = screen.getByRole("link", { name: "index@travail.gouv.fr" });
    expect(emailLink).toHaveAttribute("href", "mailto:index@travail.gouv.fr");

    const externalLinks = [
      {
        name: "https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces",
        target: "_blank",
        rel: "noreferrer",
      },
      {
        name: "Cookies & traceurs : que dit la loi ?",
        target: "_blank",
        rel: "noreferrer",
      },
      {
        name: "Cookies : les outils pour les maîtriser",
        target: "_blank",
        rel: "noreferrer",
      },
    ];

    externalLinks.forEach(link => {
      const element = screen.getByRole("link", { name: link.name });
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute("target", link.target);
      expect(element).toHaveAttribute("rel", link.rel);
    });
  });
});
