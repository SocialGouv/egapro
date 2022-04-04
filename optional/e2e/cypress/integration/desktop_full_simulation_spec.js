describe("The Home Page on desktop", function () {
  it("successfully loads", function () {
    cy.visit("/")
  })

  it("displays a button to start the simulation", function () {
    cy.contains("commencer le calcul").click()
  })

  it("redirects to the simulator with the magic code", function () {
    // The following doesn't work with cypress's `should("contain", /<regexp>/)` for some reason...
    cy.url().should((url) => {
      expect(url).to.match(/simulateur\/[^-]{8}-[^-]{4}-[^-]{4}-[^-]{4}-[^-]{12}/)
    })
  })

  it("opens a pop-in to enter an email", function () {
    cy.get("button").contains("continuer sans donner de mail").click().should("be.hidden")
  })

  it("displays a button that leads to the next step", function () {
    cy.get("a").contains("Suivant").click()
    cy.url().should("contain", "/informations")
  })

  it("displays the 'informations' form", function () {
    cy.get("input#nomEntreprise").type("acme")
    cy.get("span").contains("Entre 50 et 250").click()
    cy.get("select[name=anneeDeclaration]").select("2019")
    cy.get("input[name=finPeriodeReference]").type("25/11/2019")
    cy.get("button[type=submit]").click()
    cy.get("a").contains("Suivant").click()
    cy.url().should("contain", "effectifs")
  })

  it("displays the 'effectifs' form", function () {
    cy.get("form input")
      .should("have.length", 32)
      .each(($el) => {
        cy.wrap($el).type("5")
      })
    cy.get("button[type=submit]").click()
    cy.get("a").contains("Suivant").click()
    cy.url().should("contain", "indicateur1")
  })

  it("displays the 'indicateur1' form", function () {
    cy.get("form input[type!=radio]")
      .should("have.length", 32)
      .each(($el) => {
        cy.wrap($el).type("1000")
      })
    cy.get("button[type=submit]").click()
    cy.get("a").contains("Suivant").click()
    cy.url().should("contain", "indicateur2et3")
  })

  it("displays the 'indicateur2et3' form", function () {
    cy.get("form input[type!=radio]")
      .should("have.length", 2)
      .each(($el) => {
        cy.wrap($el).type("5")
      })
    cy.get("button[type=submit]").click()
    cy.get("a").contains("Suivant").click()
    cy.url().should("contain", "indicateur4")
  })

  it("displays the 'indicateur4' form", function () {
    cy.get("form input[type!=radio]")
      .should("have.length", 2)
      .each(($el) => {
        cy.wrap($el).type("5")
      })
    cy.get("button[type=submit]").click()
    cy.get("a").contains("Suivant").click()
    cy.url().should("contain", "indicateur5")
  })

  it("displays the 'indicateur5' form", function () {
    cy.get("form input[type!=radio]").first().type("5")
    cy.get("button[type=submit]").click()
    cy.get("a").contains("Suivant").click()
    cy.url().should("contain", "recapitulatif")
  })

  it("displays the 'recapitulatif' page", function () {
    cy.get("span").contains("votre résultat total est").next().contains("100/100")
    cy.get("button").contains("imprimer")
  })
})
