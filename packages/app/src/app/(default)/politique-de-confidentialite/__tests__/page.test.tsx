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

    for (const heading of [
      /Qui est responsable d’Egapro/,
      /Quelles sont les données à caractère personnel/,
      /Pourquoi traitons-nous des données/,
      /Qu’est-ce qui nous autorise à traiter/,
      /Pendant combien de temps les données/,
      /Quels sont vos droits/,
      /Qui va avoir accès aux données/,
      /Qui nous aide à traiter vos données/,
      /Cookies/,
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("should anchor the cookies section", () => {
    render(<PrivacyPolicy />);

    expect(screen.getByRole("heading", { name: "Cookies" })).toHaveAttribute("id", "cookies");
  });

  it("should render the contact email link", () => {
    render(<PrivacyPolicy />);

    const emailLink = screen.getByRole("link", { name: "[EMAIL_REDACTED]" });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:[EMAIL_REDACTED]");
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

  it("should render the version in force and link the archived version", () => {
    render(<PrivacyPolicy />);

    const previousVersionLink = screen.getByRole("link", { name: "Version du 18/12/2023" });
    expect(previousVersionLink).toBeInTheDocument();
    expect(previousVersionLink).toHaveAttribute("href", "/politique-de-confidentialite/18122023");
    expect(previousVersionLink).toHaveAttribute("target", "_blank");
    expect(previousVersionLink).toHaveAttribute("rel", "noreferrer");

    expect(screen.getByText("Version du 24/04/2024")).toBeInTheDocument();
  });
});
