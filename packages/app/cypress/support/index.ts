/* eslint-disable */

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands";

// in cypress/support/index.ts
// load type definitions that come with Cypress module
/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      selectByLabel(labelText: string): Chainable<Element>;
      clickRadio(legendText: string, radioLabel: string): Chainable<Element>;
      checkUrl(url: string): void;
      loginWithKeycloak(): void;
    }
  }
}
