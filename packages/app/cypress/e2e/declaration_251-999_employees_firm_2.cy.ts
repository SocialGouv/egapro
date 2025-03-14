describe("Declaration", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    cy.clearLocalStorage();
    cy.clearCookies();
    // cy.task("cleanDB").then(cy.log);
  });

  it("Doit compléter le parcours du simulateur jusqu'à la page de récapitulatif", () => {
    // load cache
    cy.visit("/");
    cy.visit("/index-egapro");
    cy.visit("/index-egapro/declaration/commencer");
    cy.intercept("GET", "/").as("pageLoad");

    // Visiter la page de démarrage du simulateur
    cy.visit("/");
    cy.wait("@pageLoad");
    cy.contains("a", "Calculer - Déclarer mon Index").click();

    cy.url().should("include", "/index-egapro");
    cy.get("#content").click();
    cy.get("#content").within(() => {
      cy.contains("a", "Déclarer mon index").click();
    });
    cy.url().should("include", "/index-egapro/declaration/assujetti");
    cy.get("#content").click();
    cy.contains("a", "Suivant").click();

    cy.url().should("include", "/login");
    cy.get("#content").click();
    cy.get(".fr-connect").click();

    cy.selectByLabel("Username").clear().type("egapro-e2e@fabrique.social.gouv.fr");
    cy.selectByLabel("Password").clear().type("DxLd8iyWamus95F4N2Vh");
    cy.get("form").submit();

    cy.url().should("include", "/index-egapro/declaration/commencer");
    cy.get("#content").click();
    cy.selectByLabel("Année au titre de laquelle les indicateurs sont calculés *").should("have.value", "2024");
    cy.selectByLabel(
      "Numéro Siren de l’entreprise ou de l’entreprise déclarant pour le compte de l'unité économique et sociale (UES) *",
    ).should("have.value", "384964508");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/declarant");
    cy.get("#content").click();
    cy.selectByLabel("Nom du déclarant *").should("have.value", "Egapro");
    cy.selectByLabel("Prénom du déclarant *").should("have.value", "Test");
    cy.selectByLabel("Téléphone du déclarant *").clear().type("0123456789");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/entreprise");
    cy.get("#content").click();
    cy.contains("label", "De 251 à 999 inclus").click();
    cy.contains("label", "Unité Économique et Sociale (UES)").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/ues");
    cy.get("#content").click();
    cy.selectByLabel("Nom de l'UES *").type("ARTUS");
    cy.contains("button", "Ajouter une entreprise").click();
    cy.get('input[name="entreprises.0.siren"]').type("442424560");
    cy.contains("button", "Ajouter une entreprise").click();
    cy.get('input[name="entreprises.1.siren"]').type("821832219");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/periode-reference");
    cy.get("#content").click();
    cy.contains("label", "Oui").click();
    cy.selectByLabel("Date de fin de la période de référence choisie pour le calcul des indicateurs *").type(
      "2024-11-30",
    );
    cy.selectByLabel(
      "Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique) *",
    ).type("398");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/remunerations");
    cy.get("#content").click();
    cy.contains("label", "Non").click();
    cy.contains(
      "label",
      "Je déclare avoir procédé au calcul de cet indicateur par catégorie socio-professionnelle, et confirme que l'indicateur n'est pas calculable. *",
    ).click();
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("egvi40pcet");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/augmentations");
    cy.get("#content").click();
    cy.contains("label", "Non").click();
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("egvi40pcet");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/promotions");
    cy.get("#content").click();
    cy.contains("label", "Non").click();
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("egvi40pcet");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/conges-maternite");
    cy.get("#content").click();
    cy.contains("label", "Non").click();
    cy.selectByLabel("Motif de non calculabilité de l'indicateur *").select("absrcm");
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/hautes-remunerations");
    cy.get("#content").click();
    cy.selectByLabel("Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté *")
      .clear()
      .type("0");
    cy.contains("label", "Hommes").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/resultat-global");
    cy.get("#content").click();
    cy.get("#content").within(() => {
      cy.contains("span", "NC").should("exist");
    });
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/publication");
    cy.get("#content").click();
    cy.selectByLabel("Date de publication des résultats obtenus *").clear().type("2025-02-27");
    cy.contains("legend", "Avez-vous un site Internet pour publier les résultats obtenus ? *")
      .closest("fieldset")
      .within(() => {
        cy.contains("label", "Non").click();
      });
    cy.selectByLabel("Préciser les modalités de communication des résultats obtenus auprès de vos salariés *")
      .clear()
      .type("Affichage au sein de l'entreprise");
    cy.contains(
      "legend",
      "Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l'UES a-t-elle bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ? *",
    )
      .closest("fieldset")
      .within(() => {
        cy.contains("label", "Non").click();
      });
    cy.get("#content").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/index-egapro/declaration/validation-transmission");
    cy.get("#content").within(() => {
      cy.contains("span", "NC").should("exist");
    });
    // cy.contains("button", "Valider et transmettre les résultats").click();
    // cy.get("#content").within(() => {
    //   cy.contains("span", "Votre déclaration a été transmise").should("exist");
    // });
  });
});
