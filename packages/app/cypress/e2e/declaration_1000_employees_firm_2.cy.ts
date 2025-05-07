// Egapro - Déclaration index - Test 4
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

    // Check if we're on the expected page
    cy.url().should("include", "/index-egapro/declaration/commencer");
    cy.selectByLabel(
      "Numéro Siren de l’entreprise ou de l’entreprise déclarant pour le compte de l'unité économique et sociale (UES) *",
    ).select("820709046");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/declarant");
    cy.selectByLabel("Nom du déclarant *").should("have.value", "Egapro");
    cy.selectByLabel("Prénom du déclarant *").should("have.value", "Test");
    cy.selectByLabel("Téléphone du déclarant *").clear().type("0666666666");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/entreprise");
    cy.contains("label", "De 1000 à plus").click();
    cy.contains("label", "Entreprise").click();
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
    ).type("1696");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations");
    cy.clickRadio("L’indicateur sur l’écart de rémunération est-il calculable ? *", "Oui");
    cy.clickRadio(
      "Modalité choisie pour le calcul de l'indicateur sur l'écart de rémunération *",
      "Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
    );
    cy.clickRadio("Un CSE a-t-il été mis en place ? *", "Non");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remuneration");
    cy.get('input[name="catégories.0.tranches.:29"]').clear();
    cy.get('input[name="catégories.0.tranches.30:39"]').clear().type("11.11");
    cy.get('input[name="catégories.0.tranches.40:49"]').clear().type("0.3");
    cy.get('input[name="catégories.0.tranches.50:"]').clear().type("-98.53");
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.1.tranches.:29"]').clear().type("6.45");
    cy.get('input[name="catégories.1.tranches.30:39"]').clear().type("2.59");
    cy.get('input[name="catégories.1.tranches.40:49"]').clear().type("9.23");
    cy.get('input[name="catégories.1.tranches.50:"]').clear().type("6.61");
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.2.tranches.:29"]').clear().type("20.51");
    cy.get('input[name="catégories.2.tranches.30:39"]').clear().type("7.29");
    cy.get('input[name="catégories.2.tranches.40:49"]').clear().type("19.97");
    cy.get('input[name="catégories.2.tranches.50:"]').clear().type("9.31");
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.3.tranches.:29"]').clear().type("14.14");
    cy.get('input[name="catégories.3.tranches.30:39"]').clear();
    cy.get('input[name="catégories.3.tranches.40:49"]').clear().type("14.86");
    cy.get('input[name="catégories.3.tranches.50:"]').clear().type("1.61");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-resultat");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("5.1");
    cy.clickRadio("Population envers laquelle l'écart est favorable *", "Femmes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/augmentations");
    cy.clickRadio(
      "L'indicateur sur l'écart de taux d'augmentations individuelles (hors promotions) est-il calculable ? *",
      "Oui",
    );
    cy.selectByLabel("Ouvriers").clear().type("27.25");
    cy.selectByLabel("Employés").clear().type("-23.66");
    cy.selectByLabel("Techniciens et agents de maîtrise").clear().type("7.09");
    cy.selectByLabel("Ingénieurs et cadres").clear().type("-17.65");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("9.4");
    cy.clickRadio("Population envers laquelle l'écart est favorable *", "Hommes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/promotions");
    cy.clickRadio("L'indicateur sur l'écart de taux de promotions est-il calculable ? *", "Oui");
    cy.selectByLabel("Ouvriers").clear().type("-30.63");
    cy.selectByLabel("Employés").clear().type("21.55");
    cy.selectByLabel("Techniciens et agents de maîtrise").clear().type("-5.07");
    cy.selectByLabel("Ingénieurs et cadres").clear().type("7.84");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("6.8");
    cy.clickRadio("Population envers laquelle l'écart est favorable *", "Femmes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/conges-maternite");
    cy.clickRadio("L'indicateur est-il calculable ? *", "Non");
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("absaugpdtcm");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/hautes-remunerations");
    cy.selectByLabel("Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté *")
      .clear()
      .type("1");
    cy.clickRadio("Sexe des salariés sur-représentés *", "Hommes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/resultat-global");
    cy.get("#content").within(() => {
      cy.contains("span", "69").should("exist");
    });
    cy.selectByLabel("Mesures de correction prévues à l'article D. 1142-6 *").select("me");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/publication");
    cy.selectByLabel("Date de publication des résultats obtenus *").clear().type("2025-03-04");
    cy.clickRadio("Avez-vous un site Internet pour publier les résultats obtenus ? *", "Oui");
    cy.selectByLabel(
      "Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les résultats obtenus *",
    )
      .clear()
      .type("http://www.test.com");
    cy.clickRadio(
      "Avez-vous bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ? *",
      "Non",
    );
    cy.get("#content").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "69").should("exist");
    });
    cy.contains("button", "Valider et transmettre les résultats").click();
    cy.contains("Votre déclaration a été transmise");
    cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    cy.contains("a", "Mes déclarations").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("820709046");
    cy.contains("a", "820709046");
    cy.contains("De 1000 à plus");

    // Déclaration progression
    cy.contains("a", "À renseigner").click();

    cy.checkUrl("/index-egapro/objectifs-mesures/820709046/2024");
    cy.get("#objectifIndicateurUn").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type(
          "S’assurer de l’égalité de rémunération à l’embauche, quel que soit le genre, à compétences et expériences équivalentes",
        );
    });
    cy.get("#objectifIndicateurTrois").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type("Tendre vers l'équilibre entre le taux de promotion des femmes et le taux de promotion des hommes");
    });
    cy.get("#objectifIndicateurCinq").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type(
          "TAttendre à minima 5/10. Pour cela, renforcer notre politique de recrutement à destination des femmes pour les postes à haut niveau de responsabilité.",
        );
    });
    cy.selectByLabel("Date de publication des objectifs de progression").clear().type("2025-03-31");
    cy.selectByLabel("Date de publication des mesures de correction").clear().type("2025-03-31");
    cy.selectByLabel("Préciser les modalités de communication des mesures de correction auprès de vos salariés.").type(
      "Note de service envoyé aux salariés",
    );
    cy.contains("button", "Valider et transmettre les informations").click();
    cy.contains("Votre déclaration a été validée et transmise");
    cy.contains("button", "Retour").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("820709046");
    cy.contains("a", "Renseignés");
  });
});
