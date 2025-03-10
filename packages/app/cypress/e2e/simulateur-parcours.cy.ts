describe("Parcours du simulateur Index Egapro", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("Doit compléter le parcours du simulateur jusqu'à la page de récapitulatif", () => {
    cy.wait(30000);
    cy.intercept("GET", "/index-egapro/simulateur/commencer").as("pageLoad");

    // Visiter la page de démarrage du simulateur
    cy.visit("/index-egapro/simulateur/commencer");
    cy.wait("@pageLoad");

    // Vérifier que nous sommes sur la bonne page
    cy.url().should("include", "/index-egapro/simulateur/commencer");
    cy.contains("h1", "Commencer une simulation de calcul").should("be.visible");

    // Commencer le simulateur
    cy.contains("a", "Suivant").click();

    // Étape 2: Informations sur l'effectif
    cy.url().should("include", "/effectifs");
    cy.contains("Étape 2").should("be.visible");

    // Sélectionner la tranche d'effectifs (250 à 999 salariés)
    cy.contains("label", "De 251 à 999 inclus").click();

    // Remplir les effectifs par CSP et tranches d'âge
    // Ouvriers
    cy.selectByLabel("ouv, :29, femmes").clear().type("10");
    cy.selectByLabel("ouv, :29, hommes").clear().type("15");
    cy.selectByLabel("ouv, 30:39, femmes").clear().type("20");
    cy.selectByLabel("ouv, 30:39, hommes").clear().type("25");
    cy.selectByLabel("ouv, 40:49, femmes").clear().type("15");
    cy.selectByLabel("ouv, 40:49, hommes").clear().type("20");
    cy.selectByLabel("ouv, 50:, femmes").clear().type("15");
    cy.selectByLabel("ouv, 50:, hommes").clear().type("20");

    // Employés
    cy.selectByLabel("emp, :29, femmes").clear().type("10");
    cy.selectByLabel("emp, :29, hommes").clear().type("15");
    cy.selectByLabel("emp, 30:39, femmes").clear().type("20");
    cy.selectByLabel("emp, 30:39, hommes").clear().type("25");
    cy.selectByLabel("emp, 40:49, femmes").clear().type("15");
    cy.selectByLabel("emp, 40:49, hommes").clear().type("20");
    cy.selectByLabel("emp, 50:, femmes").clear().type("15");
    cy.selectByLabel("emp, 50:, hommes").clear().type("20");

    // Techniciens et agents de maîtrise
    cy.selectByLabel("tam, :29, femmes").clear().type("10");
    cy.selectByLabel("tam, :29, hommes").clear().type("15");
    cy.selectByLabel("tam, 30:39, femmes").clear().type("20");
    cy.selectByLabel("tam, 30:39, hommes").clear().type("25");
    cy.selectByLabel("tam, 40:49, femmes").clear().type("15");
    cy.selectByLabel("tam, 40:49, hommes").clear().type("20");
    cy.selectByLabel("tam, 50:, femmes").clear().type("15");
    cy.selectByLabel("tam, 50:, hommes").clear().type("20");

    // Ingénieurs et cadres
    cy.selectByLabel("ic, :29, femmes").clear().type("10");
    cy.selectByLabel("ic, :29, hommes").clear().type("15");
    cy.selectByLabel("ic, 30:39, femmes").clear().type("20");
    cy.selectByLabel("ic, 30:39, hommes").clear().type("25");
    cy.selectByLabel("ic, 40:49, femmes").clear().type("15");
    cy.selectByLabel("ic, 40:49, hommes").clear().type("20");
    cy.selectByLabel("ic, 50:, femmes").clear().type("15");
    cy.selectByLabel("ic, 50:, hommes").clear().type("20");

    // Passer à l'étape suivante
    cy.contains("button", "Suivant").click();

    // Étape 3: Rémunérations
    cy.url().should("include", "/indicateur1");
    cy.contains("Étape 3").should("be.visible");

    // Sélectionner le mode de calcul (par coefficient hiérarchique)
    cy.contains(
      "label",
      "Par niveau ou coefficient hiérarchique en application de la classification de branche",
    ).click();

    // Ajouter un niveau hiérarchique et le nommer
    cy.get('input[name="remunerations.0.name"]').clear().type("Niveau A");

    // Remplir les données pour le niveau A
    // Moins de 30 ans
    cy.selectByLabel("Nombre de salariés - - :29 - Femmes").clear().type("30");
    cy.selectByLabel("Nombre de salariés - - :29 - Hommes").clear().type("40");
    cy.selectByLabel("Remu moyenne - - :29 - Femmes").clear().type("30000");
    cy.selectByLabel("Remu moyenne - - :29 - Hommes").clear().type("32000");

    // 30-39 ans
    cy.selectByLabel("Nombre de salariés - - 30:39 - Femmes").clear().type("30");
    cy.selectByLabel("Nombre de salariés - - 30:39 - Hommes").clear().type("40");
    cy.selectByLabel("Remu moyenne - - 30:39 - Femmes").clear().type("35000");
    cy.selectByLabel("Remu moyenne - - 30:39 - Hommes").clear().type("37000");

    // 40-49 ans
    cy.selectByLabel("Nombre de salariés - - 40:49 - Femmes").clear().type("30");
    cy.selectByLabel("Nombre de salariés - - 40:49 - Hommes").clear().type("40");
    cy.selectByLabel("Remu moyenne - - 40:49 - Femmes").clear().type("38000");
    cy.selectByLabel("Remu moyenne - - 40:49 - Hommes").clear().type("40000");

    // 50 ans et plus
    cy.selectByLabel("Nombre de salariés - - 50: - Femmes").clear().type("30");
    cy.selectByLabel("Nombre de salariés - - 50: - Hommes").clear().type("40");
    cy.selectByLabel("Remu moyenne - - 50: - Femmes").clear().type("38000");
    cy.selectByLabel("Remu moyenne - - 50: - Hommes").clear().type("40000");

    // Ajouter un second niveau hiérarchique
    cy.contains("button", "Ajouter un niveau ou coefficient hiérarchique").click();

    // Nommer le second niveau

    cy.get('input[name="remunerations.1.name"]').clear().type("Niveau B");

    // Remplir les données pour le niveau B
    // Moins de 30 ans
    cy.selectByLabel("Nombre de salariés - - :29 - Femmes").clear().type("30");
    cy.selectByLabel("Nombre de salariés - - :29 - Hommes").clear().type("40");
    cy.selectByLabel("Remu moyenne - - :29 - Femmes").clear().type("30000");
    cy.selectByLabel("Remu moyenne - - :29 - Hommes").clear().type("32000");

    // 30-39 ans
    cy.selectByLabel("Nombre de salariés - - 30:39 - Femmes").clear().type("30");
    cy.selectByLabel("Nombre de salariés - - 30:39 - Hommes").clear().type("40");
    cy.selectByLabel("Remu moyenne - - 30:39 - Femmes").clear().type("35000");
    cy.selectByLabel("Remu moyenne - - 30:39 - Hommes").clear().type("37000");

    // 40-49 ans
    cy.selectByLabel("Nombre de salariés - - 40:49 - Femmes").clear().type("30");
    cy.selectByLabel("Nombre de salariés - - 40:49 - Hommes").clear().type("40");
    cy.selectByLabel("Remu moyenne - - 40:49 - Femmes").clear().type("38000");
    cy.selectByLabel("Remu moyenne - - 40:49 - Hommes").clear().type("40000");

    // 50 ans et plus
    cy.selectByLabel("Nombre de salariés - - 50: - Femmes").clear().type("30");
    cy.selectByLabel("Nombre de salariés - - 50: - Hommes").clear().type("40");
    cy.selectByLabel("Remu moyenne - - 50: - Femmes").clear().type("38000");
    cy.selectByLabel("Remu moyenne - - 50: - Hommes").clear().type("40000");

    // Passer à l'étape suivante
    cy.contains("button", "Suivant").click();

    // Étape 3: Augmentations
    cy.url().should("include", "/indicateur2");
    cy.contains("Étape 4").should("be.visible");

    // Sélectionner "Non" pour indiquer qu'il n'y a pas eu d'augmentation
    cy.contains("label", "Non").first().click();

    // Passer à l'étape suivante
    cy.contains("button", "Suivant").click();

    // Étape 4: Promotions
    cy.url().should("include", "/indicateur3");
    cy.contains("Étape 5").should("be.visible");

    // Sélectionner "Non" pour indiquer qu'il n'y a pas eu de promotion
    cy.contains("label", "Non").first().click();

    // Passer à l'étape suivante
    cy.contains("button", "Suivant").click();

    // Étape 5: Congés maternité
    cy.url().should("include", "/indicateur4");
    cy.contains("Étape 6").should("be.visible");

    // Sélectionner "Oui" pour indiquer que toutes les salariées de retour de congé maternité ont bénéficié d'une augmentation
    cy.contains("label", "Oui").first().click();

    // Remplir le nombre de salariées concernées
    cy.selectByLabel("Nombre de salariées de retour de congé maternité").clear().type("3");
    cy.selectByLabel("Nombre de salariées augmentées à leur retour").clear().type("2");

    // Passer à l'étape suivante
    cy.contains("button", "Suivant").click();

    // Étape 6: Hautes rémunérations
    cy.url().should("include", "/indicateur5");
    cy.contains("Étape 7").should("be.visible");

    // Sélectionner le nombre de femmes parmi les 10 plus hautes rémunérations
    cy.selectByLabel("Nombre de femmes parmi les 10 plus hautes rémunérations").clear().type("3");
    cy.selectByLabel("Nombre d'hommes parmi les 10 plus hautes rémunérations").clear().type("7");

    // Passer à l'étape suivante
    cy.contains("button", "Suivant").click();

    // Vérifier que nous sommes sur la page de récapitulatif
    cy.url().should("include", "/recapitulatif");
    cy.contains("Récapitulatif").should("be.visible");

    // Vérifier la présence des informations de résultat
    cy.contains("Effectifs assujettis et pris en compte").should("be.visible");
    cy.contains("Indicateur écart de rémunération").should("be.visible");
    cy.contains("Indicateur écart de taux d’augmentations individuelles (hors promotions)").should("be.visible");
    cy.contains("Indicateur écart de taux de promotions").should("be.visible");
    cy.contains(
      "Indicateur pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé maternité",
    ).should("be.visible");
    cy.contains(
      "Indicateur nombre de salariés du sexe sous-représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations",
    ).should("be.visible");
  });
});
