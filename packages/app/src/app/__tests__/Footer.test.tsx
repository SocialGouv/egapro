import { render, screen } from "@testing-library/react";

import { Footer } from "../Footer";

describe("<Footer />", () => {
  it("renders the footer with correct structure", () => {
    render(<Footer />);

    // Check that the footer element exists
    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveAttribute("id", "footer");

    // Check that the main sections are present
    expect(screen.getByText("Liens utiles")).toBeInTheDocument();
    expect(screen.getByText(/Index Egapro et Représentation équilibrée/)).toBeInTheDocument();
  });

  it("displays the correct accessibility status", () => {
    render(<Footer />);

    const accessibilityLink = screen.getByText(/Accessibilité : partiellement conforme/);
    expect(accessibilityLink).toBeInTheDocument();
    expect(accessibilityLink).toHaveAttribute("href", "/declaration-accessibilite");
  });

  it("renders all external links with correct title attributes", () => {
    render(<Footer />);

    // Get all external links (those with target="_blank")
    const externalLinks = screen.getAllByRole("link").filter(link => link.getAttribute("target") === "_blank");

    // Ensure we have external links to test
    expect(externalLinks.length).toBeGreaterThan(0);

    // Check each external link has the correct title attribute format
    externalLinks.forEach(link => {
      const title = link.getAttribute("title");
      expect(title).toContain(" - ouvre une nouvelle fenêtre");
    });

    // Test specific examples
    const emailLink = screen.getByText("Contact support technique : index@travail.gouv.fr");
    expect(emailLink).toHaveAttribute("title", "envoyer un email à index@travail.gouv.fr - ouvre une nouvelle fenêtre");

    const statsLink = screen.getByText("Statistiques");
    expect(statsLink).toHaveAttribute("title", "Statistiques - ouvre une nouvelle fenêtre");

    const githubLink = screen.getByText("Contribuer sur Github");
    expect(githubLink).toHaveAttribute("title", "Contribuer sur Github - ouvre une nouvelle fenêtre");

    const licenseLink = screen.getByText("licence Apache 2.0");
    expect(licenseLink).toHaveAttribute("title", "licence egapro - ouvre une nouvelle fenêtre");
  });

  it("renders all external links with rel='noopener noreferrer'", () => {
    render(<Footer />);

    // Get all external links (those with target="_blank")
    const externalLinks = screen.getAllByRole("link").filter(link => link.getAttribute("target") === "_blank");

    // Ensure all external links have the correct rel attribute
    externalLinks.forEach(link => {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("renders the correct number of links in each section", () => {
    render(<Footer />);

    // Top section links
    const topSectionLists = document.querySelectorAll(".fr-footer__top-list");
    expect(topSectionLists.length).toBeGreaterThan(0);

    // First list should have 2 links (Contact and Referents)
    const firstList = topSectionLists[0];
    expect(firstList.querySelectorAll("li").length).toBe(2);

    // Content section links
    const contentList = document.querySelector(".fr-footer__content-list");
    expect(contentList).toBeInTheDocument();
    expect(contentList?.querySelectorAll("li").length).toBe(4);

    // Bottom section links
    const bottomList = document.querySelector(".fr-footer__bottom-list");
    expect(bottomList).toBeInTheDocument();
    expect(bottomList?.querySelectorAll("li").length).toBe(5);
  });

  it("renders the license information correctly", () => {
    render(<Footer />);

    const licenseText = screen.getByText(/Sauf mention contraire, tous les contenus de ce site sont sous/);
    expect(licenseText).toBeInTheDocument();

    const licenseLink = screen.getByText("licence Apache 2.0");
    expect(licenseLink).toBeInTheDocument();
    expect(licenseLink).toHaveAttribute("href", "https://github.com/SocialGouv/egapro/blob/master/LICENSE");
  });

  it("verifies that title attributes are consistently formatted for external links", () => {
    render(<Footer />);

    // Get all external links with title attributes
    const externalLinksWithTitles = Array.from(screen.getAllByRole("link")).filter(
      link => link.getAttribute("target") === "_blank" && link.hasAttribute("title"),
    );

    // Verify that all external link title attributes follow the same pattern
    externalLinksWithTitles.forEach(link => {
      const title = link.getAttribute("title");
      const linkText = link.textContent || "";

      // Check that the title ends with the standard suffix
      expect(title).toMatch(/ - ouvre une nouvelle fenêtre$/);

      // For links where the title starts with the link text, verify the format
      if (title?.startsWith(linkText) && linkText.length > 0) {
        expect(title).toBe(`${linkText} - ouvre une nouvelle fenêtre`);
      }
    });
  });
});
