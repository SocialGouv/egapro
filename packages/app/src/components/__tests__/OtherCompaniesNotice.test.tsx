import Alert from "@codegouvfr/react-dsfr/Alert";
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
    expect(link).toHaveAttribute("href", "https://identite.proconnect.gouv.fr/manage-organizations");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("title", "votre profil ProConnect - ouvre une nouvelle fenêtre");
  });

  it("keeps block notice content inside a block Alert description", () => {
    const { container } = render(<Alert severity="info" description={<OtherCompaniesNotice />} />);

    const alertDescription = container.querySelector(".fr-alert")?.children[0];
    const list = alertDescription?.querySelector("ul");

    expect(alertDescription?.tagName).toBe("DIV");
    expect(list).not.toBeNull();
    expect(list?.closest("p")).toBeNull();
  });
});
