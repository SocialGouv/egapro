// Egapro - Déclaration index - Test 1
describe("Declaration", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    cy.clearLocalStorage();
    cy.clearCookies();
  });
  afterEach(() => {
    cy.task("deleteTestDeclaration", {
      siren: "835256447",
      year: new Date().getFullYear() - 2,
    });
  });

  it("Doit compléter le parcours du simulateur jusqu'à la page de récapitulatif", () => {
    cy.loginWithKeycloak();

    // Visiter la page de démarrage du simulateur
    cy.visit("/");

    cy.contains("a", "Déclarer mes Écarts").click();

    cy.checkUrl("/representation-equilibree");
    cy.get("#content").within(() => {
      cy.contains("a", "Déclarer mes écarts").click();
    });

    cy.checkUrl("/representation-equilibree/assujetti");
    cy.contains(
      "label",
      "Oui, mon entreprise emploie au moins 1000 salariés pour le troisième exercice consécutif",
    ).click();
    cy.contains("a", "Suivant").click();

    // Check if we're on the expected page
    cy.url().should("include", "/representation-equilibree/commencer");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/declarant");
    cy.selectByLabel("Nom du déclarant *").should("have.value", "User");
    cy.selectByLabel("Prénom du déclarant *").should("have.value", "Test");
    cy.selectByLabel("Téléphone du déclarant *").clear().type("0123456789");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/entreprise");
    cy.should("contain.text", "835256447");
    cy.contains("a", "Suivant").click();

    cy.checkUrl("/representation-equilibree/periode-reference");
    cy.selectByLabel(
      "Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul des écarts *",
    ).type("2024-10-30");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/ecarts-cadres");
    cy.clickRadio("L’écart de représentation est-il calculable ? *", "Non");
    cy.selectByLabel("Motif de non calculabilité *").select(
      "aucun_cadre_dirigeant",
    );
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/ecarts-membres");
    cy.clickRadio("L’écart de représentation est-il calculable ? *", "Non");
    cy.selectByLabel("Motif de non calculabilité *").select(
      "aucune_instance_dirigeante",
    );
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/representation-equilibree/validation");
    cy.contains("button", "Valider et transmettre les résultats").click();
    cy.contains("Votre déclaration a été transmise");
    // cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    // cy.contains("a", "Mes déclarations").click();

    // cy.checkUrl("/mon-espace/mes-declarations");
    // cy.selectByLabel("Numéro Siren de l'entreprise").select("804450377");
    // cy.contains("a", "804450377");
    // cy.contains("NC");
  });
});
