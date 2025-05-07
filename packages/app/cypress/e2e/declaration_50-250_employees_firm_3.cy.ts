// Egapro - Déclaration index - Test 7
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
    ).select("983923384");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/declarant");
    cy.selectByLabel("Nom du déclarant *").should("have.value", "Egapro");
    cy.selectByLabel("Prénom du déclarant *").should("have.value", "Test");
    cy.selectByLabel("Téléphone du déclarant *").clear().type("0123456789");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/entreprise");
    cy.clickRadio("Vous déclarez votre index en tant que *", "Unité Économique et Sociale (UES)");
    cy.clickRadio("Tranche d'effectifs assujettis de l'UES *", "De 50 à 250 inclus");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/ues");
    cy.selectByLabel("Nom de l'UES *").clear().type("ARTUS LYON");
    cy.contains("button", "Ajouter une entreprise").click();
    cy.get('input[name="entreprises.0.siren"]').clear().type("982446213");
    cy.contains("button", "Ajouter une entreprise").click();
    cy.get('input[name="entreprises.1.siren"]').clear().type("982446122");
    cy.contains("button", "Ajouter une entreprise").click();
    cy.get('input[name="entreprises.2.siren"]').clear().type("981216658");
    cy.contains("button", "Ajouter une entreprise").click();
    cy.get('input[name="entreprises.3.siren"]').clear().type("980276067");
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
    ).type("165");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations");
    cy.clickRadio("L’indicateur sur l’écart de rémunération est-il calculable ? *", "Oui");
    cy.clickRadio(
      "Modalité choisie pour le calcul de l'indicateur sur l'écart de rémunération *",
      "Par niveau ou coefficient hiérarchique en application de la classification de branche",
    );
    cy.selectByLabel("Date de consultation du CSE pour le choix de cette modalité de calcul *").type("2025-01-30");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-coefficient-branche");
    cy.get('input[name="catégories.0.tranches.:29"]').clear();
    cy.get('input[name="catégories.0.tranches.30:39"]').clear();
    cy.get('input[name="catégories.0.tranches.40:49"]').clear();
    cy.get('input[name="catégories.0.tranches.50:"]').clear();
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.1.tranches.:29"]').clear();
    cy.get('input[name="catégories.1.tranches.30:39"]').clear();
    cy.get('input[name="catégories.1.tranches.40:49"]').clear();
    cy.get('input[name="catégories.1.tranches.50:"]').clear();
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.2.tranches.:29"]').clear().type("-1.02");
    cy.get('input[name="catégories.2.tranches.30:39"]').clear().type("-1.4");
    cy.get('input[name="catégories.2.tranches.40:49"]').clear().type("3.5");
    cy.get('input[name="catégories.2.tranches.50:"]').clear().type("-0.54");
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.3.tranches.:29"]').clear();
    cy.get('input[name="catégories.3.tranches.30:39"]').clear().type("0.55");
    cy.get('input[name="catégories.3.tranches.40:49"]').clear();
    cy.get('input[name="catégories.3.tranches.50:"]').clear().type("-1.41");
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.4.tranches.:29"]').clear();
    cy.get('input[name="catégories.4.tranches.30:39"]').clear().type("7.29");
    cy.get('input[name="catégories.4.tranches.40:49"]').clear().type("8.98");
    cy.get('input[name="catégories.4.tranches.50:"]').clear().type("-6.81");
    cy.contains("button", "Ajouter un niveau ou coefficient").click();
    cy.get('input[name="catégories.5.tranches.:29"]').clear();
    cy.get('input[name="catégories.5.tranches.30:39"]').clear();
    cy.get('input[name="catégories.5.tranches.40:49"]').clear();
    cy.get('input[name="catégories.5.tranches.50:"]').clear();
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/remunerations-resultat");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("1.4");
    cy.clickRadio("Population envers laquelle l'écart est favorable *", "Hommes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/augmentations-et-promotions");
    cy.clickRadio("L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ? *", "Oui");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en % *").clear().type("17.2");
    cy.selectByLabel("Résultat final obtenu à l'indicateur en nombre équivalent de salariés *").clear().type("12.7");
    cy.clickRadio("Population envers laquelle l'écart est favorable *", "Hommes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/conges-maternite");
    cy.clickRadio("L'indicateur est-il calculable ? *", "Non");
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select(
      "Absence de retours de congé de maternité (ou d’adoption) au cours de la période de référence",
    );
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/hautes-remunerations");
    cy.selectByLabel("Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté *")
      .clear()
      .type("4");
    cy.clickRadio("Sexe des salariés sur-représentés *", "Femmes");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/resultat-global");
    cy.get("#content").within(() => {
      cy.contains("span", "56").should("exist");
    });
    cy.selectByLabel("Mesures de correction prévues à l'article D. 1142-6 *").select("mmo");
    cy.contains("button", "Suivant").click();

    cy.checkUrl("/index-egapro/declaration/publication");
    cy.selectByLabel("Date de publication des résultats obtenus *").clear().type("2025-02-28");
    cy.clickRadio("Avez-vous un site Internet pour publier les résultats obtenus ? *", "Non");
    cy.selectByLabel("Préciser les modalités de communication des résultats obtenus auprès de vos salariés *")
      .clear()
      .type("Mail envoyé aux salariés");
    cy.clickRadio(
      "Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l'UES a-t-elle bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ? *",
      "Oui",
    );
    cy.get("#content").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "56").should("exist");
    });
    cy.contains("button", "Valider et transmettre les résultats").click();
    cy.contains("Votre déclaration a été transmise");
    cy.contains("button", Cypress.env("E2E_USERNAME")).click();
    cy.contains("a", "Mes déclarations").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("983923384");
    cy.contains("a", "983923384");
    cy.contains("De 50 à 250 inclus");

    // Déclaration progression
    cy.contains("a", "À renseigner").click();

    cy.checkUrl("/index-egapro/objectifs-mesures/983923384/2024");
    cy.get("#objectifIndicateurUn").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type(
          "Poursuivre les efforts faits en 2024 pour réduire les écarts de rémunération constatés en faveur des hommes pour des emplois comparables (à compétences, performances et expériences égales) et se rapprocher plus étroitement des 40 points.",
        );
    });
    cy.get("#objectifIndicateurDeuxTrois").within(() => {
      cy.get("textarea")
        .should("be.visible")
        .should("not.be.disabled")
        .type(
          "Etudier les situations individuelles et réajuster la politique salariale si nécessaire pour résorber les inégalités salariales le cas échéant",
        );
    });
    cy.selectByLabel("Date de publication des objectifs de progression").clear().type("2025-06-01");
    cy.selectByLabel("Date de publication des mesures de correction").clear().type("2025-06-01");
    cy.selectByLabel(
      "Préciser les modalités de communication des objectifs de progression et des mesures de correction auprès de vos salariés.",
    ).type("Note de service envoyé aux salariés");
    cy.contains("button", "Valider et transmettre les informations").click();
    cy.contains("Votre déclaration a été validée et transmise");
    cy.contains("button", "Retour").click();

    cy.checkUrl("/mon-espace/mes-declarations");
    cy.selectByLabel("Numéro Siren de l'entreprise").select("983923384");
    cy.contains("a", "Renseignés");
  });
});
