import { render, screen } from "@testing-library/react";

import Transmission from "../page";

// Mock the components
jest.mock("../DownloadRepeqPdf", () => ({
  DownloadRepeqPdf: () => <div data-testid="download-pdf">Download PDF Mock</div>,
}));

jest.mock("../SendReceipt", () => ({
  SendReceipt: () => <div data-testid="send-receipt">Send Receipt Mock</div>,
}));

describe("Transmission", () => {
  it("should render correctly", () => {
    render(<Transmission />);

    // Check success message
    expect(screen.getByRole("heading", { name: "Votre déclaration a été transmise" })).toBeInTheDocument();

    // Check receipt message
    expect(
      screen.getByText(/Vous allez recevoir un accusé de réception de cette transmission sur votre adresse email/),
    ).toBeInTheDocument();

    // Check PDF download component is rendered
    expect(screen.getByTestId("download-pdf")).toBeInTheDocument();

    // Check feedback section
    expect(screen.getByText("Aidez-nous à améliorer Egapro")).toBeInTheDocument();
    const feedbackLink = screen.getByRole("link", {
      name: "",
      href: "https://jedonnemonavis.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_source=button-declaration&key=73366ddb13d498f4c77d01c2983bab48",
    });
    expect(feedbackLink).toHaveAttribute("target", "_blank");
    expect(feedbackLink).toHaveAttribute("rel", "noreferrer");

    // Check "Et après" section
    expect(screen.getByRole("heading", { name: "Et après" })).toBeInTheDocument();

    // Check personal space card
    expect(screen.getByRole("heading", { name: "Mon espace personnel" })).toBeInTheDocument();
    expect(screen.getByText(/Vos déclarations transmises sont disponibles dans le menu/)).toBeInTheDocument();
    const personalSpaceLink = screen.getByRole("link", { name: "Accéder à mon espace" });
    expect(personalSpaceLink).toHaveAttribute("href", "/mon-espace/mes-declarations");
    expect(personalSpaceLink).toHaveAttribute("target", "_blank");

    // Check receipt component is rendered
    expect(screen.getByTestId("send-receipt")).toBeInTheDocument();

    // Check index equality section
    expect(
      screen.getByRole("heading", { name: "Avez-vous déclaré l’index égalité professionnelle F/H ?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Toutes les entreprises et unités économiques et sociales \(UES\) d’au moins 50 salariés/),
    ).toBeInTheDocument();
    const indexLink = screen.getByRole("link", {
      name: "Avez-vous déclaré l’index égalité professionnelle F/H ?",
    });
    expect(indexLink).toHaveAttribute("href", "https://egapro.travail.gouv.fr/index-egapro/");
  });
});
