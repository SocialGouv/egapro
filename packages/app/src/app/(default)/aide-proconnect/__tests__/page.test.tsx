import { render, screen } from "@testing-library/react";

import AideProConnectPage from "../page";

describe("<AideProConnectPage />", () => {
  beforeEach(() => render(<AideProConnectPage />));

  it("shows the updated introduction and account rules", () => {
    expect(
      screen.getByRole("heading", { name: "Aide pour l'utilisation du service d'identification ProConnect" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/vos écarts éventuels de représentation sur le portail Egapro/)).toBeInTheDocument();
    expect(screen.getAllByText(/sauf si elle a fermé ou quitté l'UES/)).toHaveLength(2);
    expect(screen.getByText(/Les tiers déclarants \(comptables\.\.\.\) ne sont pas autorisés/)).toBeInTheDocument();
    expect(screen.queryByText(/vous devez créer un seul compte pour une des entreprises/)).not.toBeInTheDocument();
  });

  it("links every summary entry to its section", () => {
    expect(screen.getByText("Sommaire")).toBeInTheDocument();

    const sections = [
      ["Non-réception des e-mails en provenance de ProConnect", "non-reception-emails-moncomptepro"],
      ["Comment contacter ProConnect ?", "Comment-contacter-ProConnect"],
      ["Comment s'identifier avec ProConnect ?", "Comment-s-identifier-avec-ProConnect"],
      [
        "Comment modifier mes informations personnelles sur ProConnect ?",
        "Comment-modifier-mes-informations-personnelles-sur-ProConnect",
      ],
      [
        "Comment rattacher une nouvelle entreprise à mon compte ProConnect ?",
        "Comment-rattacher-une-nouvelle-entreprise-à-mon-compte-ProConnect",
      ],
    ] as const;

    for (const [name, anchor] of sections) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", `#${anchor}`);
      expect(screen.getByRole("heading", { name })).toHaveAttribute("id", anchor);
    }
  });

  it("shows the updated email troubleshooting advice and links", () => {
    expect(screen.getByText(/MailInBlack ou Altospam/)).toBeInTheDocument();
    expect(screen.getByText(/213\.32\.191\.190/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "no-reply@account.proconnect.gouv.fr" })).toHaveAttribute(
      "href",
      "mailto:no-reply@account.proconnect.gouv.fr",
    );
    expect(screen.getByRole("link", { name: "Recréez un compte avec la bonne adresse" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Centre d'aide" })).toHaveAttribute(
      "href",
      "https://proconnect.crisp.help/fr/",
    );
    expect(screen.queryByText(/172\.246\.41\.163/)).not.toBeInTheDocument();
  });

  it("explains sign-in, account creation and company attachment", () => {
    expect(screen.getAllByText(/Se connecter ou s'inscrire à egapro/)).toHaveLength(2);
    expect(screen.getByText(/« Rejoindre votre organisation »/)).toBeInTheDocument();
    expect(screen.getByText(/Votre demande de création de compte peut être refusée/)).toBeInTheDocument();
    expect(screen.getByText(/Votre demande de rattachement peut être refusée/)).toBeInTheDocument();
    expect(screen.getByText(/Chaque entreprise devra obligatoirement créer son propre compte/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "ProConnect" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "ProConnect" })[0]).toHaveAttribute(
      "href",
      "https://identite.proconnect.gouv.fr/users/start-sign-in",
    );
  });
});
