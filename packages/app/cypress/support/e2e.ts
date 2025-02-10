// ***********************************************************
// This example support/e2e.ts is processed and
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

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on("uncaught:exception", (err, runnable) => {
  // Log detailed error information
  console.log("Uncaught exception details:", {
    message: err.message,
    stack: err.stack,
    type: err.name,
    runnable: runnable.title,
  });

  // Only suppress specific known harmless errors
  const suppressErrors = ["ResizeObserver loop limit exceeded", "Network request failed"];

  if (suppressErrors.some(e => err.message.includes(e))) {
    return false;
  }

  // Let other errors fail the test so they can be properly investigated
  return true;
});
