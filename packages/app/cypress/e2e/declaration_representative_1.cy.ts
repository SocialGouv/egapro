// Egapro - Déclaration index - Test 1
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
    cy.preloadPages();
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
    cy.selectByLabel("Numéro Siren de l’entreprise *").select("440137818");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/declarant");
    cy.selectByLabel("Nom du déclarant *").should("have.value", "Egapro");
    cy.selectByLabel("Prénom du déclarant *").should("have.value", "Test");
    cy.selectByLabel("Téléphone du déclarant *").clear().type("0123456789");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/entreprise");
    cy.should("contain.text", "440137818");
    cy.contains("a", "Suivant").click();

    cy.checkUrl("/representation-equilibree/periode-reference");
    cy.selectByLabel(
      "Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul des écarts *",
    ).type("2024-12-31");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/ecarts-cadres");
    cy.clickRadio("L’écart de représentation est-il calculable ? *", "Oui");
    cy.selectByLabel("Pourcentage de femmes parmi les cadres dirigeants *").clear().type("20.4");
    cy.selectByLabel("Pourcentage d'hommes parmi les cadres dirigeants *").clear().type("79.6");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/ecarts-membres");
    cy.clickRadio("L’écart de représentation est-il calculable ? *", "Oui");
    cy.selectByLabel("Pourcentage de femmes parmi les membres des instances dirigeantes *").clear().type("30.2");
    cy.selectByLabel("Pourcentage d'hommes parmi les membres des instances dirigeantes *").clear().type("69.8");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/representation-equilibree/publication");
    cy.selectByLabel("Date de publication des écarts calculables *").clear().type("2025-03-07");
    cy.clickRadio("Avez-vous un site Internet pour publier les écarts calculables ? *", "Oui");
    cy.selectByLabel(
      "Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les écarts calculables *",
    )
      .clear()
      .type("www.arturs.com/carrieres/egalite_professionnelle");
    cy.get("#content").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/representation-equilibree/validation");
    cy.contains("button", "Valider et transmettre les résultats").click();
    cy.contains("Votre déclaration a été transmise");
    cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    cy.contains("a", "Mes déclarations").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("440137818");
    cy.contains("a", "440137818");
    cy.contains("20.4");
    cy.contains("79.6");
    cy.contains("30.2");
    cy.contains("69.8");
  });
});
