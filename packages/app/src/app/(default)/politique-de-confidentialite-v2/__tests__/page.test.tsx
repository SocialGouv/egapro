import { render, screen } from "@testing-library/react";

import PrivacyPolicy from "../page";

// Mock the FooterConsentManagementItem component
jest.mock("../../../consentManagement", () => ({
  FooterConsentManagementItem: () => <div data-testid="footer-consent-management-item">Consent Management</div>,
}));

describe("<PrivacyPolicy />", () => {
  it("should render the page title", () => {
    render(<PrivacyPolicy />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Politique de confidentialité");
  });

  it("should render the section headings", () => {
    render(<PrivacyPolicy />);

    const responsibleHeading = screen.getByRole("heading", { name: /Qui est responsable d’Egapro/ });
    expect(responsibleHeading).toBeInTheDocument();

    const dataHeading = screen.getByRole("heading", { name: /Quelles sont les données à caractère personnel/ });
    expect(dataHeading).toBeInTheDocument();

    const whyHeading = screen.getByRole("heading", { name: /Pourquoi traitons-nous des données/ });
    expect(whyHeading).toBeInTheDocument();

    const authorizeHeading = screen.getByRole("heading", { name: /Qu’est-ce qui nous autorise à traiter/ });
    expect(authorizeHeading).toBeInTheDocument();

    const retentionHeading = screen.getByRole("heading", { name: /Pendant combien de temps les données/ });
    expect(retentionHeading).toBeInTheDocument();

    const rightsHeading = screen.getByRole("heading", { name: /Quels sont vos droits/ });
    expect(rightsHeading).toBeInTheDocument();

    const accessHeading = screen.getByRole("heading", { name: /Qui va avoir accès aux données/ });
    expect(accessHeading).toBeInTheDocument();

    const helpHeading = screen.getByRole("heading", { name: /Qui nous aide à traiter vos données/ });
    expect(helpHeading).toBeInTheDocument();

    const cookiesHeading = screen.getByRole("heading", { name: /Cookies/ });
    expect(cookiesHeading).toBeInTheDocument();
  });

  it("should render the contact email link", () => {
    render(<PrivacyPolicy />);

    const emailLink = screen.getByRole("link", { name: "index@travail.gouv.fr" });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:index@travail.gouv.fr");
  });

  it("should render the consent management component", () => {
    render(<PrivacyPolicy />);

    const consentManagement = screen.getByTestId("footer-consent-management-item");
    expect(consentManagement).toBeInTheDocument();
  });

  it("should render the CNIL links", () => {
    render(<PrivacyPolicy />);

    const cnilLinks = screen.getAllByRole("link", { name: /Cookies/ });
    expect(cnilLinks).toHaveLength(2);

    expect(cnilLinks[0]).toHaveAttribute("href", "https://www.cnil.fr/fr/cookies-traceurs-que-dit-la-loi");
    expect(cnilLinks[0]).toHaveAttribute("target", "_blank");
    expect(cnilLinks[0]).toHaveAttribute("rel", "noreferrer");

    expect(cnilLinks[1]).toHaveAttribute("href", "https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser");
    expect(cnilLinks[1]).toHaveAttribute("target", "_blank");
    expect(cnilLinks[1]).toHaveAttribute("rel", "noreferrer");
  });

  it("should render the previous version link", () => {
    render(<PrivacyPolicy />);

    const previousVersionLink = screen.getByRole("link", { name: "Version du 18/12/2023" });
    expect(previousVersionLink).toBeInTheDocument();
    expect(previousVersionLink).toHaveAttribute("href", "/politique-de-confidentialite");
    expect(previousVersionLink).toHaveAttribute("target", "_blank");
    expect(previousVersionLink).toHaveAttribute("rel", "noreferrer");
  });
});
