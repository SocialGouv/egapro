describe("Homepage", () => {
  beforeEach(() => {
    // Clear any cached state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("Affiche les informations élémentaires", () => {
    // Intercept page and data requests
    cy.intercept("GET", "/").as("pageLoad");
    cy.intercept("GET", "/_next/data/**").as("nextData");
    cy.intercept("GET", "/api/**").as("apiData");

    cy.visit("/", { timeout: 100000 });
    cy.wait("@pageLoad");

    // Wait for the page to be interactive
    cy.get("body", { timeout: 100000 }).should("be.visible");

    // Wait for main content with retry strategy
    cy.get('[id="content"]', { timeout: 100000 }).should($el => {
      expect($el).to.exist;
      expect($el).to.be.visible;

      // Check all required elements within main content
      const content = $el[0].textContent;
      expect(content).to.include("Bienvenue sur Egapro");
      expect(content).to.include("Calculer - Déclarer mon Index");
      expect(content).to.include("Consulter l'Index");
      expect(content).to.include("Déclarer mes Écarts");
      expect(content).to.include("Consulter les Écarts");
    });

    // Check login button with retry
    cy.contains(".fr-btn", "Se connecter", { timeout: 100000 }).should("be.visible");
  });

  it.skip("Affiche la popup RGPD", () => {
    cy.visit("/");
    cy.contains("À propos des cookies");
  });
});
