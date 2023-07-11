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

// Page confirmation is the objective of the funnel. It is not part of the funnel itself, but has a title and an url so is included in the static config.
type StaticConfig = Record<ExtraFunnelKey | FunnelKey, { title: string; url: string }>;

type StaticConfigValue = StaticConfig[keyof StaticConfig];

/**
 * Static configuration of the funnel. Reachable server side.
 */
export const funnelStaticConfig: StaticConfig = {
  commencer: { title: "Commencer", url: `${base}/commencer` },
  "augmentations-et-promotions": {
    title: "Écart de taux d’augmentations individuelles entre les femmes et les hommes",
    url: `${base}/augmentations-et-promotions`,
  },
  declarant: { title: "Informations déclarant", url: `${base}/declarant` },
  "declaration-existante": { title: "Déclaration existante", url: `${base}/declaration-existante` },
  augmentations: {
    title: "Écart de taux d'augmentations individuelles (hors promotion) entre les femmes et les hommes",
    url: `${base}/augmentations`,
  },
  confirmation: {
    title: "Confirmation",
    url: `${base}/confirmation`,
  },
  "conges-maternite": {
    title:
      "Pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé maternité",
    url: `${base}/conges-maternite`,
  },
  entreprise: { title: "Informations de l'entreprise / UES", url: `${base}/entreprise` },
  "hautes-remunerations": {
    title: "Nombre de salariés du sexe sous-représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations",
    url: `${base}/hautes-remunerations`,
  },
  "periode-reference": { title: "Période de référence", url: `${base}/periode-reference` },
  promotions: { title: "Écart de taux de promotions entre les femmes et les hommes", url: `${base}/promotions` },
  publication: { title: "Publication des résultats obtenus", url: `${base}/publication` },
  "remunerations-coefficient-autre": {
    title:
      "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
    url: `${base}/remunerations-coefficient-autre`,
  },
  "remunerations-coefficient-branche": {
    title:
      "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application de la classification de branche",
    url: `${base}/remunerations-coefficient-branche`,
  },
  "remunerations-csp": {
    title: "Écart de rémunération entre les femmes et les hommes par catégorie socio-professionnelle",
    url: `${base}/remunerations-csp`,
  },
  "remunerations-resultat": {
    title: "Résultat final de l’écart de rémunération entre les femmes et les hommes",
    url: `${base}/remunerations-resultat`,
  },
  remunerations: { title: "Écart de rémunération entre les femmes et les hommes", url: `${base}/remunerations` },
  "resultat-global": { title: "Niveau de résultat global", url: `${base}/resultat-global` },
  ues: { title: "Informations de l'UES", url: `${base}/ues` },
  "validation-transmission": {
    title: "Validation de la transmission des résultats",
    url: `${base}/validation-transmission`,
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
      indexStep: () => 1,
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
      indexStep: () => 2,
      next: () => funnelStaticConfig[`entreprise`],
      previous: () => funnelStaticConfig[`commencer`], // noop for first step. We declared it nevertheless to avoid having to check for its existence in the component.
    },
    entreprise: {
      indexStep: () => 3,
      next: () =>
        data.entreprise?.type === "ues" ? funnelStaticConfig[`ues`] : funnelStaticConfig[`periode-reference`],
      previous: () => funnelStaticConfig[`declarant`],
    },
    ues: {
      indexStep: () => 4,
      next: () => funnelStaticConfig[`periode-reference`],
      previous: () => funnelStaticConfig[`entreprise`],
    },
    "periode-reference": {
      indexStep: () => (data.entreprise?.type === "ues" ? 5 : 4),
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
      indexStep: () => funnelConfig(data)["remunerations"].indexStep() + 1,
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig[`remunerations`],
    },
    "remunerations-coefficient-branche": {
      indexStep: () => funnelConfig(data)["remunerations"].indexStep() + 1,
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig[`remunerations`],
    },
    "remunerations-coefficient-autre": {
      indexStep: () => funnelConfig(data)["remunerations"].indexStep() + 1,
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig[`remunerations`],
    },
    "remunerations-resultat": {
      indexStep: () =>
        data.remunerations?.mode === RemunerationsMode.Enum.CSP
          ? funnelConfig(data)["remunerations-csp"].indexStep() + 1
          : data.remunerations?.mode === RemunerationsMode.Enum.BRANCH_LEVEL
          ? funnelConfig(data)["remunerations-coefficient-branche"].indexStep() + 1
          : funnelConfig(data)["remunerations-coefficient-autre"].indexStep() + 1,
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
      indexStep: () => funnelConfig(data)["remunerations-resultat"].indexStep() + 1,
      next: () => funnelStaticConfig[`conges-maternite`],
      previous: () => funnelStaticConfig[`remunerations-resultat`],
    },
    augmentations: {
      indexStep: () => funnelConfig(data)["remunerations-resultat"].indexStep() + 1,
      next: () => funnelStaticConfig[`promotions`],
      previous: () => funnelStaticConfig[`remunerations-resultat`],
    },
    promotions: {
      indexStep: () => funnelConfig(data)["augmentations"].indexStep() + 1,
      next: () => funnelStaticConfig[`conges-maternite`],
      previous: () => funnelStaticConfig[`augmentations`],
    },
    "conges-maternite": {
      indexStep: () =>
        data.entreprise?.tranche === "50:250"
          ? funnelConfig(data)["augmentations-et-promotions"].indexStep() + 1
          : funnelConfig(data)["promotions"].indexStep() + 1,
      next: () => funnelStaticConfig[`hautes-remunerations`],
      previous: () =>
        data.entreprise?.tranche === "50:250"
          ? funnelStaticConfig[`augmentations-et-promotions`]
          : funnelStaticConfig[`promotions`],
    },
    "hautes-remunerations": {
      indexStep: () => funnelConfig(data)["conges-maternite"].indexStep() + 1,
      next: () => funnelStaticConfig[`resultat-global`],
      previous: () => funnelStaticConfig[`conges-maternite`],
    },
    "resultat-global": {
      indexStep: () => funnelConfig(data)["hautes-remunerations"].indexStep() + 1,
      next: () => funnelStaticConfig[`publication`],
      previous: () => funnelStaticConfig[`hautes-remunerations`],
    },
    publication: {
      indexStep: () => funnelConfig(data)["resultat-global"].indexStep() + 1,
      next: () => funnelStaticConfig[`validation-transmission`],
      previous: () => funnelStaticConfig[`resultat-global`],
    },
    "validation-transmission": {
      indexStep: () => funnelConfig(data)["publication"].indexStep() + 1,
      next: () => funnelStaticConfig[`confirmation`],
      previous: () => funnelStaticConfig[`publication`],
    },
  } as const);
