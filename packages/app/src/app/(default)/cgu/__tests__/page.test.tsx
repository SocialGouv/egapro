import { render, screen } from "@testing-library/react";

import Cgu from "../page";

describe("<Cgu />", () => {
  it("should render the page title", () => {
    render(<Cgu />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Conditions générales d’utilisation");
  });

  it("should render the six articles", () => {
    render(<Cgu />);

    for (const article of [
      "Article 1 - Champ d’application",
      "Article 2 - Objet",
      "Article 3 - Définitions",
      "Article 4 - Fonctionnalités",
      "Article 5 - Responsabilités",
      "Article 6 - Mise à jour des conditions générales d'utilisation",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: article })).toBeInTheDocument();
    }
  });

  it("should render the sub-articles", () => {
    render(<Cgu />);

    for (const subArticle of [
      "4.1 Création de compte",
      "4.2 Index de l’égalité professionnelle entre les femmes et les hommes",
      "4.3 Représentation équilibrée entre les femmes et les hommes dans les postes de direction",
      "4.4 Historique des déclarations",
      "4.5 Fonctionnalités ouvertes au public",
      "5.1 L'Éditeur de la Plateforme",
      "5.2 L'Utilisateur",
    ]) {
      expect(screen.getByRole("heading", { level: 3, name: subArticle })).toBeInTheDocument();
    }
  });

  it("should render the version in force and link the archived versions", () => {
    render(<Cgu />);

    expect(screen.getByText("Version du 05/10/2026")).toBeInTheDocument();

    const archivedVersions = [
      ["Version du 08/02/2021", "/cgu/08022021"],
      ["Version du 12/10/2022", "/cgu/12102022"],
      ["Version du 15/03/2024", "/cgu/15032024"],
    ];

    for (const [label, href] of archivedVersions) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("should render the ProConnect and balanced representation content", () => {
    render(<Cgu />);

    expect(screen.getByText(/s’identifiant via ProConnect/)).toBeInTheDocument();
    expect(screen.getAllByText(/au moins 1000 salariés pour le troisième exercice consécutif/)).toHaveLength(2);
  });
});
