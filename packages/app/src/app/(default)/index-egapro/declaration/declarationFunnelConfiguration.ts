import { config } from "@common/config";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { redirect } from "next/navigation";

export const nbStepsMax = 13;

const base = config.base_declaration_url;

export type FunnelKey = keyof DeclarationFormState;

type ExtendedFunnelKey = FunnelKey | "confirmation" | "declaration-existante";

type StaticConfig = Record<ExtendedFunnelKey, StaticConfigItem>;

type FunnelStep = {
  indexStep: () => number;
  next: () => StaticConfig[keyof StaticConfig];
  previous: () => StaticConfig[keyof StaticConfig];
  /**
   * Validate if user can be in the current step or be redirected.
   */
  validateStep?: () => never | void;
};

class StaticConfigItem {
  constructor(
    public name: ExtendedFunnelKey,
    public title: string,
  ) {}

  get url() {
    return `${base}/${this.name}`;
  }
}

/**
 * Static configuration of the funnel. Reachable server side.
 */
export const funnelStaticConfig: StaticConfig = {
  commencer: new StaticConfigItem("commencer", "Commencer"),
  "augmentations-et-promotions": new StaticConfigItem(
    "augmentations-et-promotions",
    "Écart de taux d’augmentations individuelles entre les femmes et les hommes",
  ),
  declarant: new StaticConfigItem("declarant", "Informations déclarant"),
  "declaration-existante": new StaticConfigItem("declaration-existante", "Déclaration existante"),
  augmentations: new StaticConfigItem(
    "augmentations",
    "Écart de taux d'augmentations individuelles (hors promotion) entre les femmes et les hommes",
  ),
  confirmation: new StaticConfigItem("confirmation", "Confirmation"),
  "conges-maternite": new StaticConfigItem(
    "conges-maternite",
    "Pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé maternité",
  ),
  entreprise: new StaticConfigItem("entreprise", "Informations entreprise / UES"),
  "hautes-remunerations": new StaticConfigItem(
    "hautes-remunerations",
    "Nombre de salariés du sexe sous-représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations",
  ),
  "periode-reference": new StaticConfigItem("periode-reference", "Informations calcul et période de référence"),
  promotions: new StaticConfigItem("promotions", "Écart de taux de promotions entre les femmes et les hommes"),
  publication: new StaticConfigItem("publication", "Publication des résultats obtenus"),
  "remunerations-coefficient-autre": new StaticConfigItem(
    "remunerations-coefficient-autre",
    "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
  ),
  "remunerations-coefficient-branche": new StaticConfigItem(
    "remunerations-coefficient-branche",
    "Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique en application de la classification de branche",
  ),
  "remunerations-csp": new StaticConfigItem(
    "remunerations-csp",
    "Écart de rémunération entre les femmes et les hommes par catégorie socio-professionnelle",
  ),
  "remunerations-resultat": new StaticConfigItem(
    "remunerations-resultat",
    "Résultat final de l’écart de rémunération entre les femmes et les hommes",
  ),
  remunerations: new StaticConfigItem("remunerations", "Écart de rémunération entre les femmes et les hommes"),
  "resultat-global": new StaticConfigItem("resultat-global", "Niveau de résultat global"),
  ues: new StaticConfigItem("ues", "Informations UES"),
  "validation-transmission": new StaticConfigItem(
    "validation-transmission",
    "Validation de la transmission des résultats",
  ),
} as const;

/**
 * Dynamic funnel configuration. Reachable client side, after using session storage form data.
 *
 * @param data formData get by useDeclarationFormManager.
 */
export const funnelConfig = (data: DeclarationFormState): Record<ExtendedFunnelKey, FunnelStep> =>
  ({
    commencer: {
      indexStep: () => 1,
      next: () =>
        data["declaration-existante"]?.status !== "creation"
          ? funnelStaticConfig[`declaration-existante`]
          : funnelStaticConfig.declarant,
      previous: () => funnelStaticConfig.commencer, // noop for first step. We declared it nevertheless to avoid having to check for its existence in the component.
    },
    confirmation: {
      // confirmation is the last step and should not be considered as a real step.
      indexStep: () => {
        throw new Error("No indexStep for confirmation step");
      },
      next: () => {
        throw new Error("No next step for confirmation step");
      },
      previous: () => {
        throw new Error("No previous step for confirmation step");
      },
    },
    "declaration-existante": {
      indexStep: () => 1, // Not applicable. Not a real step.
      next: () => funnelStaticConfig.declarant,
      previous: () => funnelStaticConfig.commencer,
      validateStep() {
        if (!data.commencer?.siren || !data.commencer.annéeIndicateurs) {
          redirect(funnelStaticConfig.commencer.url);
        }
      },
    },
    declarant: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig.entreprise,
      previous: () => funnelStaticConfig.commencer, // noop for first step. We declared it nevertheless to avoid having to check for its existence in the component.
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }
      },
    },
    entreprise: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => (data.entreprise?.type === "ues" ? funnelStaticConfig.ues : funnelStaticConfig[`periode-reference`]),
      previous: () => funnelStaticConfig.declarant,
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }
      },
    },
    ues: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`periode-reference`],
      previous: () => funnelStaticConfig.entreprise,
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.entreprise || data.entreprise.type !== "ues") {
          redirect(funnelStaticConfig.entreprise.url);
        }
      },
    },
    "periode-reference": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () =>
        data["periode-reference"]?.périodeSuffisante === "non"
          ? funnelStaticConfig[`validation-transmission`]
          : funnelStaticConfig.remunerations,
      previous: () => (data.entreprise?.type === "ues" ? funnelStaticConfig.ues : funnelStaticConfig.entreprise),
      validateStep() {
        if (!data.commencer?.annéeIndicateurs) {
          redirect(funnelStaticConfig.commencer.url);
        }
      },
    },
    remunerations: {
      indexStep: () => {
        return funnelConfig(data)["periode-reference"].indexStep() + 1;
      },
      next: () =>
        data.remunerations?.estCalculable === "non"
          ? data.entreprise?.tranche === "50:250"
            ? funnelStaticConfig[`augmentations-et-promotions`]
            : funnelStaticConfig.augmentations
          : data.remunerations?.mode === "csp"
          ? funnelStaticConfig[`remunerations-csp`]
          : data.remunerations?.mode === "niveau_branche"
          ? funnelStaticConfig[`remunerations-coefficient-branche`]
          : funnelStaticConfig[`remunerations-coefficient-autre`],

      previous: () => funnelStaticConfig[`periode-reference`],
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.entreprise) {
          redirect(funnelStaticConfig.entreprise.url);
        }

        if (data.entreprise.type === "ues" && !data.ues?.nom) {
          redirect(funnelStaticConfig.ues.url);
        }
      },
    },
    "remunerations-csp": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig.remunerations,
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.remunerations) {
          redirect(funnelStaticConfig.remunerations.url);
        }

        if (data.remunerations?.estCalculable === "non") {
          redirect(funnelStaticConfig.remunerations.url);
        } else if (data.remunerations.mode !== "csp") {
          redirect(funnelStaticConfig.remunerations.url);
        }
      },
    },
    "remunerations-coefficient-branche": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig.remunerations,
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.remunerations) {
          redirect(funnelStaticConfig.remunerations.url);
        }

        if (data.remunerations?.estCalculable === "non") {
          redirect(funnelStaticConfig.remunerations.url);
        } else if (data.remunerations.mode !== "niveau_branche") {
          redirect(funnelStaticConfig.remunerations.url);
        }
      },
    },
    "remunerations-coefficient-autre": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`remunerations-resultat`],
      previous: () => funnelStaticConfig.remunerations,
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.remunerations) {
          redirect(funnelStaticConfig.remunerations.url);
        }

        if (data.remunerations?.estCalculable === "non") {
          redirect(funnelStaticConfig.remunerations.url);
        } else if (data.remunerations.mode !== "niveau_autre") {
          redirect(funnelStaticConfig.remunerations.url);
        }
      },
    },
    "remunerations-resultat": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () =>
        data.entreprise?.tranche === "50:250"
          ? funnelStaticConfig[`augmentations-et-promotions`]
          : funnelStaticConfig.augmentations,
      previous: () =>
        data.remunerations?.estCalculable === "non"
          ? funnelStaticConfig.remunerations
          : data.remunerations?.mode === "csp"
          ? funnelStaticConfig[`remunerations-csp`]
          : data.remunerations?.mode === "niveau_branche"
          ? funnelStaticConfig[`remunerations-coefficient-branche`]
          : funnelStaticConfig[`remunerations-coefficient-autre`],
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.remunerations) {
          redirect(funnelStaticConfig.remunerations.url);
        }

        if (data.remunerations?.estCalculable === "non") {
          redirect(funnelStaticConfig.remunerations.url);
        } else if (data.remunerations.mode === "csp" && !data["remunerations-csp"]) {
          redirect(funnelStaticConfig["remunerations-csp"].url);
        } else if (data.remunerations.mode === "niveau_branche" && !data["remunerations-coefficient-branche"]) {
          redirect(funnelStaticConfig["remunerations-coefficient-branche"].url);
        } else if (data.remunerations.mode === "niveau_autre" && !data["remunerations-coefficient-autre"]) {
          redirect(funnelStaticConfig["remunerations-coefficient-autre"].url);
        }
      },
    },
    "augmentations-et-promotions": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`conges-maternite`],
      previous: () =>
        data.remunerations?.estCalculable === "non"
          ? funnelStaticConfig.remunerations
          : funnelStaticConfig[`remunerations-resultat`],
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.entreprise?.tranche || data.entreprise?.tranche !== "50:250") {
          redirect(funnelStaticConfig.entreprise.url);
        }

        if (!data["remunerations-resultat"]?.populationFavorable) {
          redirect(funnelStaticConfig.remunerations.url);
        }
      },
    },
    augmentations: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`promotions`],
      previous: () =>
        data.remunerations?.estCalculable === "non"
          ? funnelStaticConfig.remunerations
          : funnelStaticConfig[`remunerations-resultat`],
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.entreprise?.tranche || data.entreprise.tranche === "50:250") {
          redirect(funnelStaticConfig.entreprise.url);
        }

        if (!data["remunerations-resultat"]?.populationFavorable) {
          redirect(funnelStaticConfig.remunerations.url);
        }
      },
    },
    promotions: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`conges-maternite`],
      previous: () => funnelStaticConfig.augmentations,
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data.entreprise?.tranche || data.entreprise.tranche === "50:250") {
          redirect(funnelStaticConfig.entreprise.url);
        }

        if (!data["remunerations-resultat"]?.populationFavorable) {
          redirect(funnelStaticConfig.remunerations.url);
        }
      },
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
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }
      },
    },
    "hautes-remunerations": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`resultat-global`],
      previous: () => funnelStaticConfig[`conges-maternite`],
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }
      },
    },
    "resultat-global": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig.publication,
      previous: () => funnelStaticConfig[`hautes-remunerations`],
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        // TODO add more validation
      },
    },
    publication: {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig[`validation-transmission`],
      previous: () => funnelStaticConfig[`resultat-global`],
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        if (!data["periode-reference"] || data["periode-reference"].périodeSuffisante === "non") {
          redirect(funnelStaticConfig["periode-reference"].url);
        }
      },
    },
    "validation-transmission": {
      indexStep() {
        return funnelConfig(data)[this.previous().name].indexStep() + 1;
      },
      next: () => funnelStaticConfig.confirmation,
      previous: () =>
        data["periode-reference"]?.périodeSuffisante === "non"
          ? funnelStaticConfig[`periode-reference`]
          : funnelStaticConfig.publication,
      validateStep() {
        if (!data.commencer?.siren) {
          redirect(funnelStaticConfig.commencer.url);
        }

        // TODO add more validation
      },
    },
  }) as const;
