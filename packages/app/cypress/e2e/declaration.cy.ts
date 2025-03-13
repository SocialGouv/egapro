describe("Declaration", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("Doit compléter le parcours du simulateur jusqu'à la page de récapitulatif", () => {
    cy.intercept("GET", "/").as("pageLoad");

    // Visiter la page de démarrage du simulateur
    cy.visit("/");
    cy.wait("@pageLoad");
    cy.contains("a", "Calculer - Déclarer mon Index").click();

    cy.url().should("include", "/index-egapro");
    cy.get("#content").within(() => {
      cy.contains("a", "Déclarer mon index").click();
    });
    cy.url().should("include", "/index-egapro/declaration/assujetti");
    cy.contains("a", "Suivant").click();

    cy.url().should("include", "/login");
    cy.get(".fr-connect").click();

    cy.selectByLabel("Username").clear().type("egapro-e2e@fabrique.social.gouv.fr");
    cy.selectByLabel("Password").clear().type("DxLd8iyWamus95F4N2Vh");
    cy.get("form").submit();

    cy.url().should("include", "/index-egapro/declaration/commencer");
    cy.selectByLabel("Année au titre de laquelle les indicateurs sont calculés *").should("have.value", "2024");
    cy.selectByLabel(
      "Numéro Siren de l’entreprise ou de l’entreprise déclarant pour le compte de l'unité économique et sociale (UES) *",
    ).should("have.value", "384964508");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/declarant");
    cy.selectByLabel("Nom du déclarant *").should("have.value", "Egapro");
    cy.selectByLabel("Prénom du déclarant *").should("have.value", "Test");
    cy.selectByLabel("Téléphone du déclarant *").clear().type("0666666666");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/entreprise");
    cy.contains("label", "De 1000 à plus").click();
    cy.contains("label", "Entreprise").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/periode-reference");
    cy.contains("label", "Oui").click();

    cy.url().should("include", "/index-egapro/declaration/periode-reference");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Date de fin de la période de référence choisie pour le calcul des indicateurs *").type(
      "2024-12-31",
    );
    cy.selectByLabel(
      "Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique) *",
    ).type("1696");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/remunerations");
    cy.contains("label", "Oui").click();
    cy.contains("label", "Par catégorie socio-professionnelle").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/remuneration");
    cy.get('input[name="catégories.0.tranches.:29"]').clear();
    cy.get('input[name="catégories.0.tranches.30:39"]').clear();
    cy.get('input[name="catégories.0.tranches.40:49"]').clear();
    cy.get('input[name="catégories.0.tranches.50:"]').clear();
    cy.get('input[name="catégories.1.tranches.:29"]').clear().type("-0.45");
    cy.get('input[name="catégories.1.tranches.30:39"]').clear().type("-4.64");
    cy.get('input[name="catégories.1.tranches.40:49"]').clear().type("-1.69");
    cy.get('input[name="catégories.1.tranches.50:"]').clear().type("-13.29");
    cy.get('input[name="catégories.2.tranches.:29"]').clear().type("6.25");
    cy.get('input[name="catégories.2.tranches.30:39"]').clear().type("0.83");
    cy.get('input[name="catégories.2.tranches.40:49"]').clear().type("6.65");
    cy.get('input[name="catégories.2.tranches.50:"]').clear().type("5.96");
    cy.get('input[name="catégories.3.tranches.:29"]').clear().type("-4.59");
    cy.get('input[name="catégories.3.tranches.30:39"]').clear().type("5.26");
    cy.get('input[name="catégories.3.tranches.40:49"]').clear().type("5.6");
    cy.get('input[name="catégories.3.tranches.50:"]').clear().type("7.65");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/remunerations-resultat");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("0.8");
    cy.contains("label", "Hommes").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/augmentations");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Ouvriers").clear();
    cy.selectByLabel("Employés").clear().type("-3.25");
    cy.selectByLabel("Techniciens et agents de maîtrise").clear().type("2.75");
    cy.selectByLabel("Ingénieurs et cadres").clear().type("-0.77");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("0.8");
    cy.contains("label", "Femmes").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/promotions");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Ouvriers").clear();
    cy.selectByLabel("Employés").clear().type("-4.7");
    cy.selectByLabel("Techniciens et agents de maîtrise").clear().type("6.99");
    cy.selectByLabel("Ingénieurs et cadres").clear().type("-3.27");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("2.5");
    cy.contains("label", "Femmes").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/conges-maternite");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("100");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/hautes-remunerations");
    cy.selectByLabel("Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté *")
      .clear()
      .type("2");
    cy.contains("label", "Hommes").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/resultat-global");
    cy.get("#content").within(() => {
      cy.contains("span", "94").should("exist");
    });
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/publication");
    cy.selectByLabel("Date de publication des résultats obtenus *").clear().type("2025-03-07");
    cy.contains("legend", "Avez-vous un site Internet pour publier les résultats obtenus ? *")
      .closest("fieldset")
      .within(() => {
        cy.contains("label", "Oui").click();
      });
    cy.selectByLabel(
      "Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les résultats obtenus *",
    )
      .clear()
      .type("https://share.novartis.net/sites/wenovartis741/SitePages/We-Novartis.aspx");
    cy.contains(
      "legend",
      "Avez-vous bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ? *",
    )
      .closest("fieldset")
      .within(() => {
        cy.contains("label", "Non").dblclick();
      });
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "94").should("exist");
    });
    // cy.contains("button", "Valider et transmettre les résultats").click();
    // cy.get("#content").within(() => {
    //   cy.contains("span", "Votre déclaration a été transmise").should("exist");
    // });
  });
});
