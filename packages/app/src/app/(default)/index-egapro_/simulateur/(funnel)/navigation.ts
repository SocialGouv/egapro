import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { type CreateSimulationDTO } from "@common/core-domain/dtos/CreateSimulationDTO";

interface NavigationItem {
  next?(funnel?: Partial<CreateSimulationDTO>): Path;
  prev?(funnel?: Partial<CreateSimulationDTO>): Path;
  title: string;
}

export const TITLES = {
  commencer: "Commencer",
  effectifs: "Effectifs assujettis et pris en compte",
  indicateur1: "Indicateur écart de rémunération",
  indicateur2: "Indicateur écart de taux d’augmentations",
  indicateur3: "Indicateur écart de taux de promotions",
  indicateur2et3: "Indicateurs écart de taux d’augmentations et de promotions",
  indicateur4: "Indicateur retour de congé maternité",
  indicateur5: "Indicateur hautes rémunérations",
  recapitulatif: "Récapitulatif",
};

type Path = keyof typeof TITLES;

export const NAVIGATION = {
  commencer: {
    title: "Commencer",
    next() {
      return "effectifs";
    },
  },
  effectifs: {
    title: "Effectifs assujettis et pris en compte",
    next() {
      return "indicateur1";
    },
    prev() {
      return "commencer";
    },
  },
  indicateur1: {
    title: "Indicateur écart de rémunération",
    next(funnel) {
      return funnel?.effectifs?.workforceRange === CompanyWorkforceRange.Enum.FROM_50_TO_250
        ? "indicateur2et3"
        : "indicateur2";
    },
    prev() {
      return "effectifs";
    },
  },
  indicateur2: {
    title: "Indicateur écart de taux d’augmentation individuelle (hors promotions)",
    next() {
      return "indicateur3";
    },
    prev() {
      return "indicateur1";
    },
  },
  indicateur3: {
    title: "Indicateur écart de taux de promotions",
    next() {
      return "indicateur4";
    },
    prev() {
      return "indicateur2";
    },
  },
  indicateur2et3: {
    title: "Indicateurs écart de taux d’augmentation",
    next() {
      return "indicateur4";
    },
    prev() {
      return "indicateur1";
    },
  },
  indicateur4: {
    title: "Indicateur retour de congé maternité",
    next() {
      return "indicateur5";
    },
    prev(funnel) {
      return funnel?.effectifs?.workforceRange === CompanyWorkforceRange.Enum.FROM_50_TO_250
        ? "indicateur2et3"
        : "indicateur3";
    },
  },
  indicateur5: {
    title: "Indicateur hautes rémunérations",
    next() {
      return "recapitulatif";
    },
    prev() {
      return "indicateur4";
    },
  },
  recapitulatif: {
    title: "Récapitulatif",
    prev() {
      return "indicateur5";
    },
  },
} as const satisfies Record<Path, NavigationItem>;

/**
 * Retourne la liste des étapes de navigation à partir d'une étape donnée
 */
export const getFullNavigation = (funnel?: Partial<CreateSimulationDTO>, start = "commencer" as Path) => {
  const navigation: Path[] = [start];

  if (!funnel) {
    return navigation;
  }

  let currentItem = NAVIGATION[start];

  while ("next" in currentItem) {
    const next = currentItem.next(funnel);
    if (next) {
      navigation.push(next);
      currentItem = NAVIGATION[next];
    } else {
      break;
    }
  }

  return navigation;
};

export const simulateurPath = (path: Path) => `/index-egapro_/simulateur/${path}`;
