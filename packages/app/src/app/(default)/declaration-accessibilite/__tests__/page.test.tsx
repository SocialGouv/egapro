import { render, screen } from "@testing-library/react";

import AccessibilityStatement from "../page";

describe("<AccessibilityStatement />", () => {
  it("should render the page title", () => {
    render(<AccessibilityStatement />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Déclaration d'accessibilité");
  });

  it("should render the introduction text", () => {
    render(<AccessibilityStatement />);

    const introText = screen.getByText(
      /La Fabrique numérique des ministères sociaux s’engage à rendre son service accessible/,
    );
    expect(introText).toBeInTheDocument();
  });

  it("should render the section headings", () => {
    render(<AccessibilityStatement />);

    const conformityHeading = screen.getByRole("heading", { name: /Etat de conformité/ });
    expect(conformityHeading).toBeInTheDocument();

    const nonAccessibleHeading = screen.getByRole("heading", { name: /Contenus non accessibles/ });
    expect(nonAccessibleHeading).toBeInTheDocument();

    const improvementHeading = screen.getByRole("heading", { name: /Amélioration et contact/ });
    expect(improvementHeading).toBeInTheDocument();

    const recourseHeading = screen.getByRole("heading", { name: /Voie de recours/ });
    expect(recourseHeading).toBeInTheDocument();
  });

  it("should render the contact information", () => {
    render(<AccessibilityStatement />);

    const emailLink = screen.getByRole("link", { name: "index@travail.gouv.fr" });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:index@travail.gouv.fr");
  });

  it("should render external links", () => {
    render(<AccessibilityStatement />);

    const egaproLink = screen.getByRole("link", { name: "https://egapro.travail.gouv.fr/" });
    expect(egaproLink).toBeInTheDocument();
    expect(egaproLink).toHaveAttribute("href", "https://egapro.travail.gouv.fr/");
    expect(egaproLink).toHaveAttribute("target", "_blank");
    expect(egaproLink).toHaveAttribute("rel", "noreferrer");

    const araLink = screen.getByRole("link", { name: "Ara" });
    expect(araLink).toBeInTheDocument();
    expect(araLink).toHaveAttribute("href", "https://ara.numerique.gouv.fr/rapport/WaoTZUAr00Y9Cec2PQbnb/resultats");
    expect(araLink).toHaveAttribute("target", "_blank");
    expect(araLink).toHaveAttribute("rel", "noreferrer");
  });
});
