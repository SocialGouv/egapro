describe("Parcours de declaration Index Egapro", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("Doit compléter le parcours du simulateur jusqu'à la page de récapitulatif", () => {
    // Visiter la page assujetti
    cy.visit("/index-egapro/declaration/assujetti");

    // Vérifier que nous sommes sur la bonne page
    cy.url().should("include", "/index-egapro/declaration/assujetti");
    cy.contains("h1", "Êtes-vous assujetti ?").should("be.visible");

    cy.contains(
      "label",
      "Oui, mon entreprise ou UES a un effectif assujetti d'au moins 50 salariés au 1er mars",
    ).click();

    cy.contains("a", "Suivant").click();

    cy.url().should("include", "/login");

    // cy.get(".fr-connect").click();
  });
});
