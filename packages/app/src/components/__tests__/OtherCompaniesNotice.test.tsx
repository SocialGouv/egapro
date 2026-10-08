import { render, screen } from "@testing-library/react";

import { OtherCompaniesNotice } from "../OtherCompaniesNotice";

describe("OtherCompaniesNotice", () => {
  it("should list both ways to declare for other companies", () => {
    render(<OtherCompaniesNotice />);

    expect(screen.getByText(/Vous devez déclarer pour d'autres entreprises/).tagName).toBe("STRONG");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(
      /déjà rattachées à votre compte ProConnect.+déconnectez-vous puis reconnectez-vous/,
    );
    expect(items[1]).toHaveTextContent(/pas encore rattachées.+section.+Organisations.+pour les ajouter\./);
  });

  it("should link to the ProConnect profile in a new window", () => {
    render(<OtherCompaniesNotice />);

    const link = screen.getByRole("link", { name: "votre profil ProConnect" });
    expect(link).toHaveAttribute("href", "https://identite.proconnect.gouv.fr/users/start-sign-in");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("title", "votre profil ProConnect - ouvre une nouvelle fenêtre");
  });
});
