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
    cy.origin("https://keycloak.undercloud.fabrique.social.gouv.fr", () => {
      // We need to re-import Cypress environment variables in the origin context
      const username = Cypress.env("E2E_USERNAME");
      const password = Cypress.env("E2E_PASSWORD");

      // Wait for the form to be visible
      cy.get("form", { timeout: 10000 }).should("be.visible");

      // Use more reliable selectors for the username and password fields
      cy.get('input[id="username"]').clear().type(username);
      cy.get('input[id="password"]').clear().type(password);
      cy.get("form").submit();
    });

    cy.intercept("GET", "/").as("pageLoad");
    cy.get(".fr-connect").click();
    cy.contains(Cypress.env("E2E_USERNAME"));

    // Visiter la page de démarrage du simulateur
    cy.visit("/");
    cy.wait("@pageLoad");
    cy.contains("a", "Calculer - Déclarer mon Index").click();

    cy.checkUrl("/index-egapro");
    cy.get("#content").within(() => {
      cy.contains("a", "Déclarer mon index").click();
    });

    cy.checkUrl("/index-egapro/declaration/assujetti");
    cy.contains("a", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/commencer");
    cy.selectByLabel(
      "Numéro Siren de l’entreprise ou de l’entreprise déclarant pour le compte de l'unité économique et sociale (UES) *",
    ).select("491753364");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/declarant");
    cy.selectByLabel("Nom du déclarant *").should("have.value", "Egapro");
    cy.selectByLabel("Prénom du déclarant *").should("have.value", "Test");
    cy.selectByLabel("Téléphone du déclarant *").clear().type("0123456789");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/entreprise");
    cy.clickRadio("Vous déclarez votre index en tant que *", "Entreprise");
    cy.clickRadio("Tranche d'effectifs assujettis de l'entreprise *", "De 50 à 250 inclus");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/periode-reference");
    cy.clickRadio(
      "Disposez-vous d'une période de référence de 12 mois consécutifs pour le calcul de vos indicateurs ? *",
      "Oui",
    );
    cy.selectByLabel("Date de fin de la période de référence choisie pour le calcul des indicateurs *").type(
      "2024-12-31",
    );
    cy.selectByLabel(
      "Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique) *",
    ).type("59");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations");
    cy.clickRadio("L’indicateur sur l’écart de rémunération est-il calculable ? *", "Oui");
    cy.clickRadio(
      "Modalité choisie pour le calcul de l'indicateur sur l'écart de rémunération *",
      "Par catégorie socio-professionnelle",
    );
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-csp");
    cy.get('input[name="catégories.0.tranches.:29"]').clear();
    cy.get('input[name="catégories.0.tranches.30:39"]').clear().type("-3.08");
    cy.get('input[name="catégories.0.tranches.40:49"]').clear().type("1.94");
    cy.get('input[name="catégories.0.tranches.50:"]').clear().type("-3.45");

    cy.get('input[name="catégories.1.tranches.:29"]').clear();
    cy.get('input[name="catégories.1.tranches.30:39"]').clear();
    cy.get('input[name="catégories.1.tranches.40:49"]').clear();
    cy.get('input[name="catégories.1.tranches.50:"]').clear();

    cy.get('input[name="catégories.2.tranches.:29"]').clear();
    cy.get('input[name="catégories.2.tranches.30:39"]').clear();
    cy.get('input[name="catégories.2.tranches.40:49"]').clear();
    cy.get('input[name="catégories.2.tranches.50:"]').clear();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-resultat");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("0");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/augmentations-et-promotions");
    cy.clickRadio("L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ? *", "Oui");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("0");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en nombre équivalent de salariés *").clear().type("0");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/conges-maternite");
    cy.clickRadio("L'indicateur est-il calculable ? *", "Oui");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("0");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/hautes-remunerations");
    cy.selectByLabel("Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté *")
      .clear()
      .type("5");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/resultat-global");
    cy.get("#content").within(() => {
      cy.contains("span", "85").should("exist");
    });
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/publication");
    cy.selectByLabel("Date de publication des résultats obtenus *").clear().type("2025-03-01");
    cy.clickRadio("Avez-vous un site Internet pour publier les résultats obtenus ? *", "Non");
    cy.selectByLabel("Préciser les modalités de communication des résultats obtenus auprès de vos salariés *")
      .clear()
      .type("Affichage au sein de l'entreprise et note de service envoyé aux salariés");
    cy.clickRadio(
      "Avez-vous bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ? *",
      "Oui",
    );
    cy.get("#content").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "85").should("exist");
    });
    cy.contains("button", "Valider et transmettre les résultats").click();
    cy.contains("Votre déclaration a été transmise");
    cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    cy.contains("a", "Mes déclarations").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("491753364");
    cy.contains("a", "491753364");
    cy.contains("De 50 à 250 inclus");
  });
});
