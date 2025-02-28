import { render, screen } from "@testing-library/react";

import IndexEgapro from "../page";

describe("IndexEgapro", () => {
  it("should render the main title", () => {
    render(<IndexEgapro />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent(/l'index de l'égalité professionnelle/);
    expect(title).toHaveTextContent(/Bienvenue sur/);
  });

  it("should render the main description", () => {
    render(<IndexEgapro />);

    expect(
      screen.getByText(/L’index de l'égalité professionnelle a été conçu pour faire progresser/),
    ).toBeInTheDocument();
  });

  it("should render all step buttons with correct links", () => {
    render(<IndexEgapro />);

    const calculateButton = screen.getByRole("link", { name: /Calculer mon index/i });
    expect(calculateButton).toHaveAttribute("href", "/index-egapro/simulateur/commencer");

    const declareButton = screen.getByRole("link", { name: /Déclarer mon index/i });
    expect(declareButton).toHaveAttribute("href", "/index-egapro/declaration/assujetti");

    const spaceButton = screen.getByRole("link", { name: /Accéder à mon espace/i });
    expect(spaceButton).toHaveAttribute("href", "/mon-espace/mes-declarations");
  });

  it("should render help section with all links", () => {
    render(<IndexEgapro />);

    const proConnectLink = screen.getAllByRole("link", { name: /cliquez ici/i })[0];
    expect(proConnectLink).toHaveAttribute("href", "/aide-proconnect");

    const helpIndexLink = screen.getAllByRole("link", { name: /cliquez ici/i })[1];
    expect(helpIndexLink).toHaveAttribute("href", "/aide-index");

    const faqLink = screen.getAllByRole("link", {
      name: /cliquez ici/i,
    })[2];
    expect(faqLink).toHaveAttribute(
      "href",
      "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro",
    );

    const referentLink = screen.getAllByRole("link", {
      name: /cliquez ici/i,
    })[3];
    expect(referentLink).toHaveAttribute(
      "href",
      "https://egapro.travail.gouv.fr/apiv2/public/referents_egalite_professionnelle.xlsx",
    );
  });

  it("should render the publication information", () => {
    render(<IndexEgapro />);

    expect(
      screen.getByText(/L'index et les résultats obtenus à chaque indicateur doivent être publiés/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Les mesures de correction et les objectifs de progression de chacun des indicateurs/),
    ).toBeInTheDocument();
  });
});
