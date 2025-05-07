// Egapro - Déclaration index - Test 3
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

    cy.checkUrl("/index-egapro");
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
    cy.contains("label", "Unité Économique et Sociale (UES)").click();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/ues");
    cy.selectByLabel("Nom de l'UES *").type("ARTUS");
    cy.contains("button", "Ajouter une entreprise").click();
    cy.get('input[name="entreprises.0.siren"]').type("442424560");
    cy.contains("button", "Ajouter une entreprise").click();
    cy.get('input[name="entreprises.1.siren"]').type("821832219");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/periode-reference");
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Date de fin de la période de référence choisie pour le calcul des indicateurs *").type(
      "2024-11-30",
    );
    cy.selectByLabel(
      "Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique) *",
    ).type("398");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations");
    cy.contains("label", "Non").click();
    cy.contains(
      "label",
      "Je déclare avoir procédé au calcul de cet indicateur par catégorie socio-professionnelle, et confirme que l'indicateur n'est pas calculable. *",
    ).click();
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("egvi40pcet");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/augmentations");
    cy.contains("label", "Non").click();
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("egvi40pcet");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/promotions");
    cy.contains("label", "Non").click();
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("egvi40pcet");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/conges-maternite");
    cy.contains("label", "Non").click();
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("absrcm");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/hautes-remunerations");
    cy.selectByLabel("Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté *")
      .clear()
      .type("0");
    cy.contains("label", "Hommes").click();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/resultat-global");
    cy.get("#content").within(() => {
      cy.contains("span", "NC").should("exist");
    });
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/publication");
    cy.selectByLabel("Date de publication des résultats obtenus *").clear().type("2025-02-27");
    cy.clickRadio("Avez-vous un site Internet pour publier les résultats obtenus ? *", "Non");
    cy.selectByLabel("Préciser les modalités de communication des résultats obtenus auprès de vos salariés *")
      .clear()
      .type("Affichage au sein de l'entreprise");
    cy.clickRadio(
      "Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l'UES a-t-elle bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ? *",
      "Non",
    );
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "NC").should("exist");
    });
    cy.contains("button", "Valider et transmettre les résultats").click();
    cy.contains("Votre déclaration a été transmise");
    cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    cy.contains("a", "Mes déclarations").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("384964508");
    cy.contains("a", "384964508");
    cy.contains("De 251 à 999 inclus");
  });
});
