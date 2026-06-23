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
  cy.url().should("include", url);
  // Wait for Next.js hydration: #content must be visible, then click
  // to trigger reflow and confirm the page is interactive.
  cy.get("#content", { timeout: 30000 }).should("be.visible");
  cy.get("#content").click({ force: true });
});

Cypress.Commands.add("loginWithProConnect", () => {
  // Cypress cannot drive the real ProConnect OIDC flow: it spans external
  // superdomains (fca.integ01 / test-idp) and cy.origin loses the NextAuth
  // state/PKCE cookies, so the callback fails with "State cookie was missing".
  // Use the dev-only /api/test-login bypass (disabled in prod) that establishes
  // the session for the fixed ProConnect sandbox test account server-side.
  cy.session(
    "proconnect-test-user",
    () => {
      cy.request("POST", "/api/test-login").its("status").should("eq", 200);
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.request("/api/auth/session").its("body.user.email").should("be.a", "string");
      },
    },
  );
});
