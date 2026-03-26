// Egapro - Déclaration index - Test 9
describe("Declaration", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    cy.clearLocalStorage();
    cy.clearCookies();
  });
  afterEach(() => {
    cy.request({ method: "POST", url: "/apiv2/clean-test-user/declaration", failOnStatusCode: false }).then((response) => { cy.log(`Clean endpoint: status=${response.status}, body=${JSON.stringify(response.body)}`); });
  });

  it("Doit compléter le parcours du simulateur jusqu'à la page de récapitulatif", () => {
    cy.loginWithKeycloak();
    // Clean any leftover declarations (important for retry attempts)
    cy.request({ method: "POST", url: "/apiv2/clean-test-user/declaration", failOnStatusCode: false });

    // Visiter la page de démarrage du simulateur
    cy.visit("/");
    cy.get("#content", { timeout: 30000 }).should("be.visible");

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
    ).select("834547168");
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
      "Non",
    );
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "NC").should("exist");
    });
    cy.contains("button", "Valider et transmettre les résultats").click();

    cy.contains("Votre déclaration a été transmise", { timeout: 60000 });
    cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    cy.contains("a", "Mes déclarations").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("834547168");
    cy.contains("a", "834547168");
    cy.contains("De 50 à 250 inclus");
  });
});
