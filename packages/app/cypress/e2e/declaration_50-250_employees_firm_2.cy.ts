// Egapro - Déclaration index - Test 6
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
    cy.loginWithKeycloak();

    // Visiter la page de démarrage du simulateur
    cy.visit("/");

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
    ).select("817989791");
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
      "Oui",
    );
    cy.selectByLabel("Date de fin de la période de référence choisie pour le calcul des indicateurs *").type(
      "2024-12-31",
    );
    cy.selectByLabel(
      "Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique) *",
    ).type("107");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations");
    cy.clickRadio("L’indicateur sur l’écart de rémunération est-il calculable ? *", "Oui");
    cy.clickRadio(
      "Modalité choisie pour le calcul de l'indicateur sur l'écart de rémunération *",
      "Par catégorie socio-professionnelle",
    );
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-csp");
    cy.get('input[name="catégories.0.tranches.:29"]').clear();
    cy.get('input[name="catégories.0.tranches.30:39"]').clear();
    cy.get('input[name="catégories.0.tranches.40:49"]').clear();
    cy.get('input[name="catégories.0.tranches.50:"]').clear();

    cy.get('input[name="catégories.1.tranches.:29"]').clear();
    cy.get('input[name="catégories.1.tranches.30:39"]').clear();
    cy.get('input[name="catégories.1.tranches.40:49"]').clear();
    cy.get('input[name="catégories.1.tranches.50:"]').clear();

    cy.get('input[name="catégories.2.tranches.:29"]').clear();
    cy.get('input[name="catégories.2.tranches.30:39"]').clear().type("-0.31");
    cy.get('input[name="catégories.2.tranches.40:49"]').clear().type("0.29");
    cy.get('input[name="catégories.2.tranches.50:"]').clear().type("0.55");

    cy.get('input[name="catégories.3.tranches.:29"]').clear();
    cy.get('input[name="catégories.3.tranches.30:39"]').clear();
    cy.get('input[name="catégories.3.tranches.40:49"]').clear().type("5.27");
    cy.get('input[name="catégories.3.tranches.50:"]').clear().type("5.04");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-resultat");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("10.8");
    cy.clickRadio("Population envers laquelle l'écart est favorable *", "Hommes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/augmentations-et-promotions");
    cy.clickRadio("L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ? *", "Oui");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("8.2");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en nombre équivalent de salariés *").clear().type("2.9");
    cy.clickRadio("Population envers laquelle l'écart est favorable *", "Femmes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/conges-maternite");
    cy.clickRadio("L'indicateur est-il calculable ? *", "Oui");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("100");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/hautes-remunerations");
    cy.selectByLabel("Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté *")
      .clear()
      .type("0");
    cy.clickRadio("Sexe des salariés sur-représentés *", "Hommes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/resultat-global");
    cy.get("#content").within(() => {
      cy.contains("span", "75").should("exist");
    });
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/publication");
    cy.selectByLabel("Date de publication des résultats obtenus *").clear().type("2025-03-03");
    cy.clickRadio("Avez-vous un site Internet pour publier les résultats obtenus ? *", "Non");
    cy.selectByLabel("Préciser les modalités de communication des résultats obtenus auprès de vos salariés *")
      .clear()
      .type("Affichage au sein de l'entreprise");
    cy.clickRadio(
      "Avez-vous bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ? *",
      "Non",
    );
    cy.get("#content").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "75").should("exist");
    });
    cy.contains("button", "Valider et transmettre les résultats").click();
    cy.contains("Votre déclaration a été transmise");
    cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    cy.contains("a", "Mes déclarations").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("817989791");
    cy.contains("a", "817989791");
    cy.contains("De 50 à 250 inclus");

    // Déclaration progression
    cy.contains("a", "À renseigner").click();

    cy.checkUrl("/index-egapro/objectifs-mesures/817989791/2024");
    cy.get("#objectifIndicateurUn").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type("Objectif 30/40 en réduisant l'écart de rémunération entre les hommes et les femmes à moins de 5%");
    });
    cy.get("#objectifIndicateurCinq").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type("Objectif 10/10 en réduisant l'écart de rémunération entre les hommes et les femmes à moins de 5%");
    });
    cy.selectByLabel("Date de publication des objectifs de progression").clear().type("2025-04-10");
    cy.selectByLabel("Préciser les modalités de communication des objectifs de progression auprès de vos salariés.")
      .clear()
      .type("Affichage au sein de l'entreprise");
    cy.contains("button", "Valider et transmettre les informations").click();
    cy.contains("Votre déclaration a été validée et transmise");
    cy.contains("button", "Retour").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("817989791");
    cy.contains("a", "Renseignés");
  });
});
