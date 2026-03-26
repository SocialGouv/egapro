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
  // Wait for Next.js hydration to complete before interacting with the page.
  // The __next div gets a data-reactroot-like structure only after hydration,
  // but the most reliable signal is that buttons/inputs become interactive.
  cy.get("#content", { timeout: 10000 }).should("be.visible");
  cy.get("#content").click({ force: true });
  // Small stability wait to let React finish any pending state updates
  // after hydration (useEffect, data fetching, etc.)
  cy.wait(300);
});

Cypress.Commands.add("loginWithKeycloak", () => {
  const keycloakUrl = Cypress.env("KEYCLOAK_URL") as string;

  // Clear all cookies to ensure clean login
  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();

  cy.visit("/login");
  cy.checkUrl("/login");
  cy.get(".fr-connect").click();

  const username = Cypress.env("E2E_USERNAME");
  const password = Cypress.env("E2E_PASSWORD");

  // cy.origin() is needed when the app and Keycloak are on different ports of the
  // same host (local dev: localhost:3000 vs localhost:8180). In CI, they are on
  // different subdomains of the same domain (*.ovh.fabrique.social.gouv.fr) which
  // Cypress treats as same superdomain, so cy.origin() must NOT be used.
  const baseUrl = new URL(Cypress.config("baseUrl")!);
  const keycloakParsed = new URL(keycloakUrl);
  const needsCrossOrigin = baseUrl.hostname === keycloakParsed.hostname && baseUrl.port !== keycloakParsed.port;

  if (needsCrossOrigin) {
    cy.origin(keycloakUrl, { args: { username, password } }, ({ username, password }) => {
      // Wait for form or handle SSO auto-redirect (no form if already authenticated)
      cy.get("body", { timeout: 30000 }).then(($body) => {
        if ($body.find('input[id="username"]').length > 0) {
          cy.get('input[id="username"]').clear().type(username);
          cy.get('input[id="password"]').clear().type(password);
          cy.get("form").submit();
        }
      });
    });
  } else {
    // Same superdomain (CI): interact directly without cy.origin()
    // Must wait for the redirect to Keycloak before interacting with the form,
    // otherwise cy.get("body") resolves on the app page before navigation occurs.
    cy.url({ timeout: 30000 }).should("include", keycloakParsed.hostname);
    cy.get('input[id="username"]', { timeout: 30000 }).clear().type(username);
    cy.get('input[id="password"]').clear().type(password);
    cy.get("form").submit();
  }

  // Wait for redirect back to app origin after Keycloak login
  cy.url({ timeout: 30000 }).should("include", Cypress.config("baseUrl")!);
  cy.get(".fr-header__tools-links", { timeout: 30000 }).should("exist");
});
