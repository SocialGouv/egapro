const React = require("react");

function MockComponent(props) {
  return React.createElement(
    "div",
    Object.assign({ "data-testid": "dsfr-mock" }, props),
  );
}

// Helpers expected by some DSFR modules
const createModal = jest.fn(() => ({
  open: jest.fn(),
  close: jest.fn(),
  isOpenedByDefault: false,
}));

const startReactDsfr = jest.fn();
const createConsentManagement = jest.fn(() => ({}));

/**
 * Generic mock for `@codegouvfr/react-dsfr/<something>` imports.
 *
 * IMPORTANT: the Jest setup here runs many test files as ESM.
 * In Node ESM, `import X from "cjs"` gives you **module.exports** as the default.
 * So `module.exports` must itself be a valid React component (callable function),
 * otherwise React will receive an object and crash with “Element type is invalid”.
 */
const callable = MockComponent;

module.exports = new Proxy(callable, {
  get(target, prop) {
    if (prop === "__esModule") return true;
    if (prop === "default") return target;
    if (prop === "createModal") return createModal;
    if (prop === "startReactDsfr") return startReactDsfr;
    if (prop === "createConsentManagement") return createConsentManagement;
    // Support patterns like: `import { Button } from "@codegouvfr/react-dsfr/Button"`
    return target;
  },
});
