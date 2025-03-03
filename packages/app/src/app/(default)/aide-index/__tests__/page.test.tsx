import { render, screen } from "@testing-library/react";

import AideSimulation from "../page";

describe("<AideSimulation />", () => {
  it("should render the page title", () => {
    render(<AideSimulation />);

    const title = screen.getByText(
      "Aide pour le calcul, la publication et la transmission de l'index égalité professionnelle femmes-hommes",
    );
    expect(title).toBeInTheDocument();
  });

  it("should render the FAQ link", () => {
    render(<AideSimulation />);

    const faqText = screen.getByText(/Pour consulter la/);
    const faqLink = faqText.querySelector("a");
    expect(faqLink).toHaveAttribute(
      "href",
      "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro",
    );
  });

  it("should render the summary section", () => {
    render(<AideSimulation />);

    const summaryTitle = screen.getByText("Sommaire");
    expect(summaryTitle).toBeInTheDocument();

    const summaryLink = screen.getByRole("link", { name: "Champ d'application" });
    expect(summaryLink).toBeInTheDocument();
  });

  it("should render the content sections", () => {
    render(<AideSimulation />);

    const champApplicationSection = screen.getByRole("heading", { name: "Champ d'application" });
    expect(champApplicationSection).toBeInTheDocument();

    const periodeReferenceSection = screen.getByRole("heading", { name: "Période de référence" });
    expect(periodeReferenceSection).toBeInTheDocument();

    const effectifsPrisEnCompteSection = screen.getByRole("heading", { name: "Effectifs pris en compte" });
    expect(effectifsPrisEnCompteSection).toBeInTheDocument();
  });
});
