import { startClientSideIsDarkLogic, useIsDarkClientSide } from "@codegouvfr/react-dsfr/useIsDark/client";
import { getScriptToRunAsap } from "@codegouvfr/react-dsfr/useIsDark/scriptToRunAsap";
import { render } from "@testing-library/react";

import { defaultColorScheme } from "../defaultColorScheme";

type SetIsDark = ReturnType<typeof useIsDarkClientSide>["setIsDark"];

const html = document.documentElement;
const realLocalStorage = window.localStorage;
const securityError = () => new DOMException("The operation is insecure.", "SecurityError");

const blockStorageAccess = () =>
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get: () => {
      throw securityError();
    },
  });

const restoreStorage = () =>
  Object.defineProperty(window, "localStorage", { configurable: true, value: realLocalStorage });

const setOsDark = (dark: boolean) =>
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches: dark && query === "(prefers-color-scheme: dark)" }),
  });

const start = () =>
  startClientSideIsDarkLogic({
    doPersistDarkModePreferenceWithCookie: false,
    registerEffectAction: action => action(),
    colorSchemeExplicitlyProvidedAsParameter: defaultColorScheme,
    doCheckNonce: true,
    trustedTypesPolicyName: "react-dsfr",
  });

const renderSetIsDark = () => {
  let setIsDark: SetIsDark | undefined;
  const Probe = () => {
    setIsDark = useIsDarkClientSide().setIsDark;
    return null;
  };
  render(<Probe />);
  return setIsDark as SetIsDark;
};

const flushMutations = () => new Promise(resolve => setTimeout(resolve, 0));

// Each start registers an observer on <html> that outlives the test: disconnect them between tests.
const RealMutationObserver = window.MutationObserver;
const observers: MutationObserver[] = [];
class TrackedMutationObserver extends RealMutationObserver {
  constructor(callback: MutationCallback) {
    super(callback);
    observers.push(this);
  }
}

describe("Initialisation du thème DSFR", () => {
  let uncaught: unknown[];

  beforeAll(() => {
    window.MutationObserver = TrackedMutationObserver;
  });

  afterAll(() => {
    window.MutationObserver = RealMutationObserver;
  });
  const onError = (event: ErrorEvent) => {
    uncaught.push(event.error ?? event.message);
    event.preventDefault();
  };

  beforeEach(() => {
    uncaught = [];
    window.addEventListener("error", onError);
    [...html.attributes].forEach(attr => html.removeAttribute(attr.name));
    restoreStorage();
    localStorage.clear();
    setOsDark(false);
  });

  afterEach(() => {
    observers.splice(0).forEach(observer => observer.disconnect());
    window.removeEventListener("error", onError);
    jest.restoreAllMocks();
    restoreStorage();
  });

  describe("stockage local inaccessible", () => {
    it("démarre sans exception quand l'accès à localStorage lève une SecurityError", () => {
      blockStorageAccess();
      setOsDark(true);

      expect(() => start()).not.toThrow();
      expect(html.getAttribute("data-fr-theme")).toBe("dark");
      expect(html.getAttribute("data-fr-scheme")).toBe("dark");
    });

    it("démarre sans exception quand getItem lève une SecurityError", () => {
      jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw securityError();
      });

      expect(() => start()).not.toThrow();
      expect(html.getAttribute("data-fr-theme")).toBe("light");
    });

    it("applique le changement de thème pour la session quand setItem lève une SecurityError", () => {
      start();
      const setIsDark = renderSetIsDark();
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw securityError();
      });

      expect(() => setIsDark(true)).not.toThrow();
      expect(html.getAttribute("data-fr-theme")).toBe("dark");
    });

    it("le script exécuté au plus tôt pose le thème quand l'accès au stockage est refusé", () => {
      blockStorageAccess();
      setOsDark(true);

      const script = getScriptToRunAsap({ defaultColorScheme, nonce: undefined, trustedTypesPolicyName: "react-dsfr" });
      expect(() => new Function(script)()).not.toThrow();
      expect(html.getAttribute("data-fr-theme")).toBe("dark");
    });
  });

  describe("attribut data-fr-theme retiré de <html>", () => {
    it("restaure le thème courant au lieu de lever une assertion", async () => {
      setOsDark(true);
      start();

      html.removeAttribute("data-fr-theme");
      html.removeAttribute("data-fr-scheme");
      await flushMutations();

      expect(uncaught).toEqual([]);
      expect(html.getAttribute("data-fr-theme")).toBe("dark");
      expect(html.getAttribute("data-fr-scheme")).toBe("dark");
    });

    it("suit toujours un changement de thème posé sur l'attribut", async () => {
      start();
      const setIsDark = renderSetIsDark();

      html.setAttribute("data-fr-js", "true");
      html.setAttribute("data-fr-theme", "dark");
      await flushMutations();
      html.removeAttribute("data-fr-theme");
      await flushMutations();

      expect(uncaught).toEqual([]);
      expect(html.getAttribute("data-fr-theme")).toBe("dark");
      expect(() => setIsDark(false)).not.toThrow();
    });
  });

  describe("stockage local accessible", () => {
    it.each([
      ["light", false, "light"],
      ["dark", false, "dark"],
      ["system", true, "dark"],
      ["system", false, "light"],
    ])("préférence stockée %s, OS sombre %s : thème %s", (stored, osDark, expected) => {
      localStorage.setItem("scheme", stored);
      setOsDark(osDark);

      start();

      expect(html.getAttribute("data-fr-theme")).toBe(expected);
    });

    it("persiste le thème choisi avant le démarrage du DSFR", () => {
      start();
      const setIsDark = renderSetIsDark();

      setIsDark(true);

      expect(localStorage.getItem("scheme")).toBe("dark");
      expect(html.getAttribute("data-fr-theme")).toBe("dark");
    });
  });
});
