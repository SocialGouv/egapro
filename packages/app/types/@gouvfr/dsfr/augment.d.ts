import { type DisclosureEventDetail, type DsfrConfig, type DsfrFramework } from "@gouvfr/dsfr";

declare global {
  interface Window {
    set dsfr(dsfr: DsfrConfig);
    get dsfr(): DsfrFramework;
  }

  interface GlobalEventHandlersEventMap {
    /** Fermeture de l'élément. */
    "dsfr.conceal": CustomEvent<DisclosureEventDetail>;
    /** Ouverture de l'élément. */
    "dsfr.disclose": CustomEvent<DisclosureEventDetail>;
  }
}

export {};
