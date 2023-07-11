import { config } from "@common/config";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";

export const nbSteps = 12;

const base = config.base_declaration_url;

type FunnelStep = {
  indexStep: () => number;
  next: () => StaticConfigValue;
  previous: () => StaticConfigValue;
};

export type FunnelKey = keyof DeclarationFormState;

type ExtraFunnelKey = "confirmation" | "declaration-existante";

type StaticConfigItem = { name: FunnelKey; title: string; url: string };

// Page confirmation is the objective of the funnel. It is not part of the funnel itself, but has a title and an url so is included in the static config.
type StaticConfig = Record<ExtraFunnelKey | FunnelKey, StaticConfigItem>;

type StaticConfigValue = StaticConfig[keyof StaticConfig];

function url(item: StaticConfigItem) {
  return `${base}/${item.name}`;
}

/**
 * Static configuration of the funnel. Reachable server side.
 */
export const funnelStaticConfig: StaticConfig = {
  commencer: {
    title: "Commencer",
    name: "commencer",
    get url() {
      return url(this);
    },
  },
  "augmentations-et-promotions": {
    name: "augmentations-et-promotions",
    title: "Écart de taux d’augmentations individuelles entre les femmes et les hommes",
    get url() {
      return url(this);
    },
  },
  declarant: {
    title: "Informations déclarant",
    name: "declarant",
    get url() {
      return url(this);
    },
  },

  "declaration-existante": {
    name: "declaration-existante",
    title: "Déclaration existante",
    get url() {
      return url(this);
    },
  },
  augmentations: {
    name: "augmentations",
    title: "Écart de taux d'augmentations individuelles (hors promotion) entre les femmes et les hommes",
    get url() {
      return url(this);
    },
  },
  confirmation: {
    name: "confirmation",
    title: "Confirmation",
    get url() {
      return url(this);
    },
  },
  "conges-maternite": {
    name: "conges-maternite",
    title:
      "Pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé maternité",
    get url() {
      return url(this);
    },
  },
  entreprise: {
    name: "entreprise",
    title: "Informations de l'entreprise / UES",
    get url() {
      return url(this);
    },
  },
  "hautes-remunerations": {
    name: "hautes-remunerations",
    title: "Nombre de salariés du sexe sous-représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations",
    get url() {
      return url(this);
    },
  },
  "periode-reference": { name: "periode-reference", title: "Période de référence", url: `${base}/periode-reference` },
  promotions: {
    name: "promotions",
    title: "Écart de taux de promotions entre les femmes et les hommes",
    get url() {
      return url(this);
    },
  },
  publication: {
    name: "publication",
    title: "Publication des résultats obtenus",
    get url() {
      return url(this);
    },
  },
  "remunerations-coefficient-autre": {
    name: "remunerations-coefficient-autre",
    title:
      "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
    get url() {
      return url(this);
    },
  },
  "remunerations-coefficient-branche": {
    name: "remunerations-coefficient-branche",
    title:
      "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application de la classification de branche",
    get url() {
      return url(this);
    },
  },
  "remunerations-csp": {
    name: "remunerations-csp",
    title: "Écart de rémunération entre les femmes et les hommes par catégorie socio-professionnelle",
    get url() {
      return url(this);
    },
  },
  "remunerations-resultat": {
    name: "remunerations-resultat",
    title: "Résultat final de l’écart de rémunération entre les femmes et les hommes",
    get url() {
      return url(this);
    },
  },
  remunerations: {
    name: "remunerations",
    title: "Écart de rémunération entre les femmes et les hommes",
    get url() {
      return url(this);
    },
  },
  "resultat-global": {
    name: "resultat-global",
    title: "Niveau de résultat global",
    get url() {
      return url(this);
    },
  },
  ues: {
    name: "ues",
    title: "Informations de l'UES",
    get url() {
      return url(this);
    },
  },
  "validation-transmission": {
    name: "validation-transmission",
    title: "Validation de la transmission des résultats",
    get url() {
      return url(this);
    },
  },
} as const;

/**
 * Dynamic funnel configuration. Reachable client side, after using session storage form data.
 *
 * @param data formData get by useDeclarationFormManager.
 */
export const funnelConfig: (data: DeclarationFormState) => Record<FunnelKey, FunnelStep> = (
  data: DeclarationFormState,
) =>
  ({
    commencer: {
      indexStep: () => 5,
      next: () =>
        data?.["declaration-existante"]?.status !== "creation"
          ? funnelStaticConfig[`declaration-existante`]
          : funnelStaticConfig[`entreprise`],
      previous: () => funnelStaticConfig[`commencer`], // noop for first step. We declared it nevertheless to avoid having to check for its existence in the component.
    },
    "declaration-existante": {
      indexStep: () => 1, // noop. We declared it to avoid having to complexify the type.
      next: () => funnelStaticConfig[`declarant`], // noop. We declared it to avoid having to complexify the type.
      previous: () => funnelStaticConfig[`commencer`], // noop. We declared it to avoid having to complexify the type.
    },
    declarant: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`entreprise`],
      previous: () => funnelStaticConfig[`commencer`], // noop for first step. We declared it nevertheless to avoid having to check for its existence in the component.
    },
    entreprise: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () =>
        data.entreprise?.type === "ues" ? funnelStaticConfig[`ues`] : funnelStaticConfig[`periode-reference`],
      previous: () => funnelStaticConfig[`declarant`],
    },
    ues: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`periode-reference`],
      previous: () => funnelStaticConfig[`entreprise`],
    },
    "periode-reference": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`remunerations`],
      previous: () => (data.entreprise?.type === "ues" ? funnelStaticConfig[`ues`] : funnelStaticConfig[`entreprise`]),
    },
    remunerations: {
      indexStep: () => {
        return funnelConfig(data)["periode-reference"].indexStep() + 1;
      },
      next: () =>
        data.remunerations?.estCalculable === "non"
          ? data.entreprise?.tranche === "50:250"
            ? funnelStaticConfig[`augmentations-et-promotions`]
            : funnelStaticConfig[`augmentations`]
          : data.remunerations?.mode === RemunerationsMode.Enum.CSP
          ? funnelStaticConfig[`remunerations-csp`]
          : data.remunerations?.mode === RemunerationsMode.Enum.BRANCH_LEVEL
          ? funnelStaticConfig[`remunerations-coefficient-branche`]
          : funnelStaticConfig[`remunerations-coefficient-autre`],

      previous: () => funnelStaticConfig[`periode-reference`],
    },
    "remunerations-csp": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig[`remunerations`],
    },
    "remunerations-coefficient-branche": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig[`remunerations`],
    },
    "remunerations-coefficient-autre": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig[`remunerations`],
    },
    "remunerations-resultat": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () =>
        data.entreprise?.tranche === "50:250"
          ? funnelStaticConfig[`augmentations-et-promotions`]
          : funnelStaticConfig[`augmentations`],
      previous: () =>
        data.remunerations?.mode === RemunerationsMode.Enum.CSP
          ? funnelStaticConfig[`remunerations-csp`]
          : data.remunerations?.mode === RemunerationsMode.Enum.BRANCH_LEVEL
          ? funnelStaticConfig[`remunerations-coefficient-branche`]
          : funnelStaticConfig[`remunerations-coefficient-autre`],
    },
    "augmentations-et-promotions": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`conges-maternite`],
      previous: () => funnelStaticConfig[`remunerations-resultat`],
    },
    augmentations: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`promotions`],
      previous: () => funnelStaticConfig[`remunerations-resultat`],
    },
    promotions: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`conges-maternite`],
      previous: () => funnelStaticConfig[`augmentations`],
    },
    "conges-maternite": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`hautes-remunerations`],
      previous: () =>
        data.entreprise?.tranche === "50:250"
          ? funnelStaticConfig[`augmentations-et-promotions`]
          : funnelStaticConfig[`promotions`],
    },
    "hautes-remunerations": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`resultat-global`],
      previous: () => funnelStaticConfig[`conges-maternite`],
    },
    "resultat-global": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`publication`],
      previous: () => funnelStaticConfig[`hautes-remunerations`],
    },
    publication: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`validation-transmission`],
      previous: () => funnelStaticConfig[`resultat-global`],
    },
    "validation-transmission": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`confirmation`],
      previous: () => funnelStaticConfig[`publication`],
    },
  } as const);
