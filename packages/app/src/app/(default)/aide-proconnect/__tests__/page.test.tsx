import { render, screen } from "@testing-library/react";

import AideProConnectPage from "../page";

describe("<AideProConnectPage />", () => {
  it("should render the page title", () => {
    render(<AideProConnectPage />);

    const title = screen.getByText(
      "Aide pour l'utilisation du service d'identification ProConnect (anciennement MonComptePro)",
    );
    expect(title).toBeInTheDocument();
  });

  it("should render the introduction text", () => {
    render(<AideProConnectPage />);

    const introText = screen.getByText(
      "Egapro utilise le service d'identification ProConnect afin de garantir l'appartenance de ses utilisateurs aux entreprises déclarantes.",
    );
    expect(introText).toBeInTheDocument();
  });

  it("should render the summary section", () => {
    render(<AideProConnectPage />);

    const summaryTitle = screen.getByText("Sommaire");
    expect(summaryTitle).toBeInTheDocument();

    const summaryLink = screen.getByRole("link", { name: "Non réception des mails en provenance de ProConnect" });
    expect(summaryLink).toBeInTheDocument();
  });

  it("should render the content sections", () => {
    render(<AideProConnectPage />);

    const nonReceptionSection = screen.getByRole("heading", {
      name: "Non réception des mails en provenance de ProConnect",
    });
    expect(nonReceptionSection).toBeInTheDocument();

    const contacterSection = screen.getByRole("heading", { name: "Comment contacter ProConnect ?" });
    expect(contacterSection).toBeInTheDocument();

    const identifierSection = screen.getByRole("heading", { name: "Comment s'identifier avec ProConnect ?" });
    expect(identifierSection).toBeInTheDocument();
  });
});
