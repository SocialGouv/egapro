import { render, screen } from "@testing-library/react";

// Mock the components that are imported in the page component
jest.mock("../DownloadRepeqPdf", () => ({
  DownloadRepeqPdf: () => <p data-testid="download-pdf">Télécharger le récapitulatif de la déclaration</p>,
}));

jest.mock("../SendReceipt", () => ({
  SendReceipt: () => <div data-testid="send-receipt">Send Receipt Component</div>,
}));

// Import the component after mocking dependencies
import Transmission from "../page";

describe("Transmission", () => {
  it("should render correctly", () => {
    render(<Transmission />);

    // Check title and success message
    expect(screen.getByRole("heading", { name: "Votre déclaration a été transmise" })).toBeInTheDocument();

    // Check important text content
    expect(screen.getByText(/Vous allez recevoir un accusé de réception/, { exact: false })).toBeInTheDocument();

    // Check "Et après" section
    expect(screen.getByRole("heading", { name: "Et après" })).toBeInTheDocument();

    // Check card title
    expect(screen.getByText("Mon espace personnel")).toBeInTheDocument();

    // Check button to access personal space
    const personalSpaceButton = screen.getByRole("link", { name: "Accéder à mon espace" });
    expect(personalSpaceButton).toBeInTheDocument();
    expect(personalSpaceButton).toHaveAttribute("href", "/mon-espace/mes-declarations");

    // Check index egapro card
    expect(screen.getByText(/Avez-vous déclaré l’index égalité professionnelle F\/H/)).toBeInTheDocument();

    // Check link to JDMA
    const jdmaLink = screen.getByRole("link", { name: "" });
    expect(jdmaLink).toBeInTheDocument();
    expect(jdmaLink).toHaveAttribute("href", expect.stringContaining("jedonnemonavis.numerique.gouv.fr"));

    // Check that the mocked components are rendered
    expect(screen.getByTestId("download-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("send-receipt")).toBeInTheDocument();
  });
});
