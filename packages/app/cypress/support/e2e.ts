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

  // Define patterns for errors to suppress
  const suppressPatterns = [
    // System/environment errors
    "ResizeObserver loop limit exceeded",
    "Network request failed",
    "Failed to call method: org.freedesktop.portal.Settings.Read",
    // React/Next.js errors
    "Hydration failed because the initial UI does not match what was rendered on the server",
    "There was an error while hydrating",
    "switch to client rendering",
    "Loading chunk",
    "Loading CSS chunk",
    "Minified React error #", // Handle all minified React errors
    // DSFR-related errors
    "@codegouvfr/react-dsfr/useIsDark",
    "MutationObserver.observe",
    // Production build errors
    "https://reactjs.org/docs/error-decoder.html",
  ];

  // Check if error matches any of our suppression patterns
  const shouldSuppress = suppressPatterns.some(pattern => {
    return err.message?.includes(pattern) || err.stack?.includes(pattern);
  });

  if (shouldSuppress) {
    console.log("Suppressing known error:", {
      message: err.message,
      type: err.name,
      pattern: suppressPatterns.find(p => err.message?.includes(p) || err.stack?.includes(p)),
    });
    return false;
  }

  // Log and fail test for unknown errors
  console.log("Unknown error - failing test:", err);
  return true;
});
