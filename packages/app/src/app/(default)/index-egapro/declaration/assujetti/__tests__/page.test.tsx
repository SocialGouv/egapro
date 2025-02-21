import { fireEvent, render, screen } from "@testing-library/react";

import AssujettiPage from "../page";

// Mock useHasMounted to return true
jest.mock("@components/utils/ClientOnly", () => ({
  ClientOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useHasMounted: jest.fn(() => true),
}));

describe("AssujettiPage", () => {
  it("should render title and explanation text", async () => {
    render(await AssujettiPage());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Êtes-vous assujetti ?");
    expect(
      screen.getByText(/Toutes les entreprises et unités économiques et sociales \(UES\) d'au moins 50 salariés/),
    ).toBeInTheDocument();
    expect(screen.getByText(/L'assujettissement est défini à la date de l’obligation/)).toBeInTheDocument();
  });

  it("should show Suivant button when Oui is selected", async () => {
    render(await AssujettiPage());

    const ouiRadio = screen.getByLabelText(
      /Oui, mon entreprise ou UES a un effectif assujetti d'au moins 50 salariés au 1er mars/,
    );
    expect(ouiRadio).toBeChecked();

    const suivantButton = screen.getByRole("link", { name: /Suivant/i });
    expect(suivantButton).toBeInTheDocument();
    expect(suivantButton).toHaveAttribute("href", "/index-egapro/declaration/commencer");
  });

  it("should show CallOut when Non is selected", async () => {
    render(await AssujettiPage());

    const nonRadio = screen.getByLabelText(
      /Non, mon entreprise ou UES n'a pas un effectif assujetti d'au moins 50 salariés au 1er mars/,
    );
    fireEvent.click(nonRadio);

    const callout = screen.getByText(/Votre entreprise ou UES n'est pas concernée/);
    expect(callout).toBeInTheDocument();
    expect(callout.closest(".fr-callout")).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /Retour à la page d'accueil/i });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveClass("fr-btn");
  });

  it("should toggle between Suivant button and CallOut", async () => {
    render(await AssujettiPage());

    const ouiRadio = screen.getByLabelText(
      /Oui, mon entreprise ou UES a un effectif assujetti d'au moins 50 salariés au 1er mars/,
    );
    const nonRadio = screen.getByLabelText(
      /Non, mon entreprise ou UES n'a pas un effectif assujetti d'au moins 50 salariés au 1er mars/,
    );

    // Initial state: Oui selected
    expect(ouiRadio).toBeChecked();
    expect(screen.getByRole("link", { name: /Suivant/i })).toBeInTheDocument();
    expect(screen.queryByText(/Votre entreprise ou UES n'est pas concernée/)).not.toBeInTheDocument();

    // Click Non
    fireEvent.click(nonRadio);
    expect(nonRadio).toBeChecked();
    expect(screen.queryByRole("link", { name: /Suivant/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Votre entreprise ou UES n'est pas concernée/)).toBeInTheDocument();

    // Click Oui again
    fireEvent.click(ouiRadio);
    expect(ouiRadio).toBeChecked();
    expect(screen.getByRole("link", { name: /Suivant/i })).toBeInTheDocument();
    expect(screen.queryByText(/Votre entreprise ou UES n'est pas concernée/)).not.toBeInTheDocument();
  });
});
