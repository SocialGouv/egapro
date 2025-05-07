// Egapro - Déclaration index - Test 2
describe("Declaration", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    cy.clearLocalStorage();
    cy.clearCookies();
  });
  afterEach(() => {
    cy.request("POST", "/apiv2/clean-test-user/declaration");
  });

  it("Doit compléter le parcours du simulateur jusqu'à la page de récapitulatif", () => {
    // load cache
    cy.visit("/");

    cy.visit("/login");
    cy.checkUrl("/login");
    cy.get(".fr-connect").click();

    // Use cy.origin() to handle cross-origin commands
    cy.location("origin").should("eq", "https://keycloak.undercloud.fabrique.social.gouv.fr");
    // We need to re-import Cypress environment variables in the origin context
    const username = Cypress.env("E2E_USERNAME");
    const password = Cypress.env("E2E_PASSWORD");

    // Wait for the form to be visible
    cy.get("form", { timeout: 10000 }).should("be.visible");

    // Use more reliable selectors for the username and password fields
    cy.get('input[id="username"]').clear().type(username);
    cy.get('input[id="password"]').clear().type(password);
    cy.get("form").submit();

    cy.intercept("GET", "/").as("pageLoad");
    cy.get(".fr-header__tools-links").should("exist");

    // Visiter la page de démarrage du simulateur
    cy.visit("/");
    cy.wait("@pageLoad");
    cy.contains("a", "Calculer - Déclarer mon Index").click();

    cy.visit("/index-egapro");
    cy.get("#content").within(() => {
      cy.contains("a", "Déclarer mon index").click();
    });

    cy.checkUrl("/index-egapro/declaration/assujetti");
    cy.contains("a", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/commencer");
    cy.selectByLabel(
      "Numéro Siren de l’entreprise ou de l’entreprise déclarant pour le compte de l'unité économique et sociale (UES) *",
    ).select("384964508");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/declarant");
    cy.selectByLabel("Nom du déclarant *").should("have.value", "Egapro");
    cy.selectByLabel("Prénom du déclarant *").should("have.value", "Test");
    cy.selectByLabel("Téléphone du déclarant *").clear().type("0123456789");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/entreprise");
    cy.contains("label", "De 251 à 999 inclus").click();
    cy.contains("label", "Entreprise").click();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/periode-reference");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Date de fin de la période de référence choisie pour le calcul des indicateurs *").type(
      "2024-12-31",
    );
    cy.selectByLabel(
      "Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique) *",
    ).type("288");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations");
    cy.contains("label", "Oui").click();
    cy.contains(
      "label",
      "Par niveau ou coefficient hiérarchique en application de la classification de branche",
    ).click();
    cy.clickRadio("Un CSE a-t-il été mis en place ? *", "Oui");
    cy.selectByLabel("Date de consultation du CSE pour le choix de cette modalité de calcul *")
      .clear()
      .type("2025-02-14");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-coefficient-branche");
    cy.get('input[name="catégories.0.tranches.:29"]').clear();
    cy.get('input[name="catégories.0.tranches.30:39"]').clear();
    cy.get('input[name="catégories.0.tranches.40:49"]').clear();
    cy.get('input[name="catégories.0.tranches.50:"]').clear();
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.1.tranches.:29"]').clear().type("0.79");
    cy.get('input[name="catégories.1.tranches.30:39"]').clear().type("5.19");
    cy.get('input[name="catégories.1.tranches.40:49"]').clear().type("1.9");
    cy.get('input[name="catégories.1.tranches.50:"]').clear().type("-0.02");
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.2.tranches.:29"]').clear().type("0");
    cy.get('input[name="catégories.2.tranches.30:39"]').clear().type("-2.19");
    cy.get('input[name="catégories.2.tranches.40:49"]').clear().type("-9.72");
    cy.get('input[name="catégories.2.tranches.50:"]').clear().type("5.17");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-resultat");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("1.1");
    cy.contains("label", "Hommes").click();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/augmentations");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Ouvriers").clear();
    cy.selectByLabel("Employés").clear();
    cy.selectByLabel("Techniciens et agents de maîtrise").clear();
    cy.selectByLabel("Ingénieurs et cadres").clear().type("0.6");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("0.6");
    cy.contains("label", "Hommes").click();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/promotions");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Ouvriers").clear();
    cy.selectByLabel("Employés").clear();
    cy.selectByLabel("Techniciens et agents de maîtrise").clear();
    cy.selectByLabel("Ingénieurs et cadres").clear().type("9.74");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("9.7");
    cy.contains("label", "Hommes").click();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/conges-maternite");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("100");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/hautes-remunerations");
    cy.selectByLabel("Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté *")
      .clear()
      .type("1");
    cy.contains("label", "Hommes").click();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/resultat-global");
    cy.get("#content").within(() => {
      cy.contains("span", "78").should("exist");
    });
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/publication");
    cy.selectByLabel("Date de publication des résultats obtenus *").clear().type("2025-02-18");
    cy.clickRadio("Avez-vous un site Internet pour publier les résultats obtenus ? *", "Oui");
    cy.selectByLabel(
      "Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les résultats obtenus *",
    )
      .clear()
      .type("http://www.test.com");
    cy.clickRadio(
      "Avez-vous bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ? *",
      "Oui",
    );
    cy.get("#content").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "78").should("exist");
    });
    cy.contains("button", "Valider et transmettre les résultats").click();
    cy.contains("Votre déclaration a été transmise");
    cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    cy.contains("a", "Mes déclarations").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("384964508");
    cy.contains("a", "384964508");
    cy.contains("De 251 à 999 inclus");

    // Déclaration progression
    cy.contains("a", "À renseigner").click();

    cy.checkUrl("/index-egapro/objectifs-mesures/384964508/2024");
    cy.get("#objectifIndicateurUn").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type("L'objectif est de ramener les écarts de rémunération à 0,1 voire à 0.");
    });
    cy.get("#objectifIndicateurTrois").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type("A compétence égale prioriser la promotion des femmes.");
    });
    cy.get("#objectifIndicateurCinq").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type(
          "L’objectif de progression est d’avoir au moins deux femmes dans cette catégorie et obtenir une note de 5/10 sur cet indicateur.",
        );
    });
    cy.selectByLabel("Date de publication des objectifs de progression").clear().type("2025-07-01");
    cy.contains("button", "Valider et transmettre les informations").click();
    cy.contains("Votre déclaration a été validée et transmise");
    cy.contains("button", "Retour").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("384964508");
    cy.contains("a", "Renseignés");
  });
});
