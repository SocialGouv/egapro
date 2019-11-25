describe("The Home Page on desktop", function() {
  it("successfully loads", function() {
    cy.visit("/");
  });

  it("displays a button to start the simulation", function() {
    cy.contains("commencer le calcul").click();
  });

  it("redirects to the simulator with the magic code", function() {
    // The following doesn't work with cypress's `should("contain", /<regexp>/)` for some reason...
    cy.url().should(url => {
      expect(url).to.match(
        /simulateur\/[^-]{8}-[^-]{4}-[^-]{4}-[^-]{4}-[^-]{12}/
      );
    });
  });

  it("opens a pop-in to enter an email", function() {
    cy.get("input#email").type("test@example.com");
    cy.get("button[type=submit]")
      .click()
      .should("not.be.visible");
  });
});
