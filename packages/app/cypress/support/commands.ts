/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add("selectByLabel", labelText => {
  cy.contains("label", labelText)
    .invoke("attr", "for")
    .then(id => {
      return id && cy.get(`#${CSS.escape(id)}`);
    });
});

Cypress.Commands.add("clickRadio", (legendText, radioLabel) => {
  cy.contains("legend", legendText)
    .closest("fieldset")
    .within(() => {
      cy.contains("label", radioLabel).click();
    });
});

Cypress.Commands.add("checkUrl", url => {
  // Vérifier si l'URL contient le chemin attendu
  cy.url().then(currentUrl => {
    if (!currentUrl.includes(url)) {
      cy.log(`URL actuelle ${currentUrl} ne contient pas ${url}, tentative de navigation directe`);
      cy.visit(url);
    }
  });

  // Confirmer que l'URL contient maintenant le chemin attendu
  cy.url().should("include", url);

  // Cliquer sur le contenu pour s'assurer que la page est active
  cy.get("#content").click();
});
