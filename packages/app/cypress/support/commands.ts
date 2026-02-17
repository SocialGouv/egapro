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

Cypress.Commands.add("selectByLabel", (labelText) => {
  cy.contains("label", labelText)
    .invoke("attr", "for")
    .then((id) => {
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

Cypress.Commands.add("checkUrl", (url) => {
  cy.url().should("include", url);
  cy.get("#content").click();
});

Cypress.Commands.add("loginWithKeycloak", () => {
  cy.visit("/login");
  cy.checkUrl("/login");
  cy.get(".fr-connect").click();

  // cy.location("origin").should("eq", "https://keycloak.undercloud.fabrique.social.gouv.fr");
  const username = "testuser";
  const password = "password";

  cy.get("form", { timeout: 10000 }).should("be.visible");
  cy.get('input[id="username"]').clear().type(username);
  cy.get('input[id="password"]').clear().type(password);
  cy.get("form").submit();

  cy.get(".fr-header__tools-links").should("exist");
});
