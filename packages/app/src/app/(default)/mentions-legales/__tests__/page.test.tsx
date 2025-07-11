import { render, screen } from "@testing-library/react";

import LegalNotice from "../page";

describe("<LegalNotice />", () => {
  it("should render the page title", () => {
    render(<LegalNotice />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Mentions légales");
  });

  it("should render the section headings", () => {
    render(<LegalNotice />);

    const editorHeading = screen.getByRole("heading", { name: /Éditeur de la plateforme/ });
    expect(editorHeading).toBeInTheDocument();

    const directorHeading = screen.getByRole("heading", { name: /Directeur de la publication/ });
    expect(directorHeading).toBeInTheDocument();

    const hostingHeading = screen.getByRole("heading", { name: /Hébergement de la plateforme/ });
    expect(hostingHeading).toBeInTheDocument();

    const accessibilityHeading = screen.getByRole("heading", { name: /Accessibilité/ });
    expect(accessibilityHeading).toBeInTheDocument();

    const securityHeading = screen.getByRole("heading", { name: /Sécurité/ });
    expect(securityHeading).toBeInTheDocument();
  });

  it("should render the accessibility link", () => {
    render(<LegalNotice />);

    const accessibilityLink = screen.getByRole("link", { name: "https://accessibilite.numerique.gouv.fr/" });
    expect(accessibilityLink).toBeInTheDocument();
    expect(accessibilityLink).toHaveAttribute("href", "https://accessibilite.numerique.gouv.fr/");
    expect(accessibilityLink).toHaveAttribute("target", "_blank");
    expect(accessibilityLink).toHaveAttribute("rel", "noreferrer");
  });
});
