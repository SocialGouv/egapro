declare module "@gouvfr/dsfr/dist/dsfr.nomodule";
declare module "@gouvfr/dsfr/dist/dsfr.module";
declare module "@gouvfr/dsfr/dist/patch/patch.module";
declare module "@gouvfr/dsfr/dist/dsfr/dsfr.module";
declare module "@gouvfr/dsfr" {
  export type Modes = "angular" | "auto" | "loaded" | "manual" | "react" | "runtime" | "vue";

  export interface Inspector {
    state: () => void;
    tree: () => void;
  }

  export interface DsfrConfig {
    mode?: Modes;
    verbose?: boolean;
  }

  export interface Disclosure {
    conceal(): void;
    disclose(): void;
  }

  export interface DisclosureEventDetail {
    ariaControls: boolean;
    ariaState: boolean;
    canConceal: boolean;
    id: strinig;
  }

  export type ModalInstance = Disclosure;
  export type AccordionMemberInstance = Disclosure;

  export interface AccordionsGroupInstance {
    /** instance de l'accordéon selectionné (null par par défaut) **/
    current: object | null;
    /** indique si le composant est focus **/
    hasFocus: boolean;
    /** index de l'accordéon selectionné (-1 par défaut) **/
    index: number;
    /** nombre d'instances de collapse du groupe **/
    length: number;
    /** tableau des instances de collapse du groupe **/
    members: AccordionMemberInstance[];
  }

  export interface InstanceManager {
    accordionsGroup: AccordionsGroupInstance;
    modal: ModalInstance;
  }

  export interface DsfrFramework extends Required<DsfrConfig> {
    inspector: Inspector;
    (element: HTMLElement | null): InstanceManager;
    start(): void;
    stop(): void;
  }
}
