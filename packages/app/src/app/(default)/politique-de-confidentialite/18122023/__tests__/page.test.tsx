import { render, screen } from "@testing-library/react";

import PrivacyPolicy from "../page";

// Mock the FooterConsentManagementItem component
jest.mock("../../../../consentManagement", () => ({
  FooterConsentManagementItem: () => <div data-testid="footer-consent-management-item">Consent Management</div>,
}));

describe("<PrivacyPolicy /> (version du 18/12/2023)", () => {
  it("should render the archived wording", () => {
    render(<PrivacyPolicy />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Politique de confidentialité");
    expect(screen.getByRole("heading", { name: /Qui est responsable d’Index Egapro/ })).toBeInTheDocument();
    expect(screen.getByText(/Index Egapro met en place deux index conçus/)).toBeInTheDocument();
  });

  it("should not link any version from the archived page", () => {
    render(<PrivacyPolicy />);

    expect(screen.queryByRole("link", { name: /Version du/ })).not.toBeInTheDocument();
  });
});
