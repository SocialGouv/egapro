describe("Homepage", () => {
  it("Affiche les informations élémentaires", () => {
    cy.visit("/");
    cy.contains("Bienvenue sur Egapro");
    cy.contains(".fr-btn", "Calculer - Déclarer mon Index");
    cy.contains(".fr-btn", "Consulter l'Index");
    cy.contains(".fr-btn", "Déclarer mes Écarts");
    cy.contains(".fr-btn", "Consulter les Écarts");
    cy.contains(".fr-btn", "Se connecter");
  });
  it("Affiche la popup RGPD", () => {
    cy.visit("/");
    cy.contains("À propos des cookies");
  });
});
