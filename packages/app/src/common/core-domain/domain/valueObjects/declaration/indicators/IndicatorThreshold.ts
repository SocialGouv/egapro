// Thresholds are of form {threshold: note}

import { type DeclarationDTO, type IndicatorKey } from "@common/core-domain/dtos/DeclarationDTO";
import { max } from "lodash";

type THRESHOLD = Map<number, number>;

export const REMUNERATIONS_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 40],
  [0.05, 39],
  [1.05, 38],
  [2.05, 37],
  [3.05, 36],
  [4.05, 35],
  [5.05, 34],
  [6.05, 33],
  [7.05, 31],
  [8.05, 29],
  [9.05, 27],
  [10.05, 25],
  [11.05, 23],
  [12.05, 21],
  [13.05, 19],
  [14.05, 17],
  [15.05, 14],
  [16.05, 11],
  [17.05, 8],
  [18.05, 5],
  [19.05, 2],
  [20.05, 0],
]);

export const AUGMENTATIONS_HP_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 20],
  [2.05, 10],
  [5.05, 5],
  [10.05, 0],
]);

export const AUGMENTATIONS_PROMOTIONS_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 35],
  [2.05, 25],
  [5.05, 15],
  [10.05, 0],
]);

export const PROMOTIONS_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 15],
  [2.05, 10],
  [5.05, 5],
  [10.05, 0],
]);

export const CONGES_MATERNITE_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 0],
  [100.0, 15],
]);

export const HAUTES_REMUNERATIONS_THRESHOLDS: THRESHOLD = new Map([
  [0, 0],
  [2, 5],
  [4, 10],
  [6, 0],
]);

export const computeGenericIndicatorNote = (result: number, thresholds: THRESHOLD) => {
  let previous = 0;

  thresholds.forEach((note, threshold) => {
    if (result >= threshold) previous = note;
  });

  return previous;
};

// TODO: refactor new IndicateurUnComputer().getMaxNote()
export const indicatorNoteMax: Record<IndicatorKey, number> = {
  remunerations: max([...REMUNERATIONS_THRESHOLDS].map(([, note]) => note)) as number,
  augmentations: max([...AUGMENTATIONS_HP_THRESHOLDS].map(([, note]) => note)) as number,
  promotions: max([...PROMOTIONS_THRESHOLDS].map(([, note]) => note)) as number,
  "augmentations-et-promotions": max([...AUGMENTATIONS_PROMOTIONS_THRESHOLDS].map(([, note]) => note)) as number,
  "conges-maternite": max([...CONGES_MATERNITE_THRESHOLDS].map(([, note]) => note)) as number,
  "hautes-remunerations": max([...HAUTES_REMUNERATIONS_THRESHOLDS].map(([, note]) => note)) as number,
};

// TODO: refactor en new IndicateurUnComputer().computeNote(result)
export const computeIndicator1Note = (result: number) => computeGenericIndicatorNote(result, REMUNERATIONS_THRESHOLDS);
export const computeIndicator2Note = (result: number) =>
  computeGenericIndicatorNote(result, AUGMENTATIONS_HP_THRESHOLDS);
export const computeIndicator3Note = (result: number) => computeGenericIndicatorNote(result, PROMOTIONS_THRESHOLDS);
export const computeIndicator2And3Note = (result: number) =>
  computeGenericIndicatorNote(result, AUGMENTATIONS_PROMOTIONS_THRESHOLDS);
export const computeIndicator4Note = (result: number) =>
  computeGenericIndicatorNote(result, CONGES_MATERNITE_THRESHOLDS);
export const computeIndicator5Note = (result: number) =>
  computeGenericIndicatorNote(result, HAUTES_REMUNERATIONS_THRESHOLDS);

export const computeIndex = (
  formState: DeclarationDTO,
): { index: number | undefined; points: number; pointsCalculables: number } => {
  let points = 0;
  let max = 0;

  if (formState["remunerations"]?.estCalculable === "oui") {
    points += formState["remunerations-resultat"]?.note || 0;
    max += indicatorNoteMax.remunerations;
  }

  if (formState.entreprise?.tranche === "50:250") {
    if (formState["augmentations-et-promotions"]?.estCalculable === "oui") {
      points += formState["augmentations-et-promotions"].note;
      max += indicatorNoteMax["augmentations-et-promotions"];
    }
  } else {
    if (formState["augmentations"]?.estCalculable === "oui") {
      points += formState["augmentations"].note;
      max += indicatorNoteMax["augmentations"];
    }
    if (formState["promotions"]?.estCalculable === "oui") {
      points += formState["promotions"].note;
      max += indicatorNoteMax["promotions"];
    }
  }

  if (formState["conges-maternite"]?.estCalculable === "oui") {
    points += formState["conges-maternite"].note;
    max += indicatorNoteMax["conges-maternite"];
  }

  points += formState["hautes-remunerations"]?.note || 0;
  max += indicatorNoteMax["hautes-remunerations"];

  return {
    points,
    pointsCalculables: max,
    index: max >= 75 ? Math.round((points / max) * 100) : undefined, // undefined means "Non calculable".
  };
};

type ComputerDeclarationInput = {
  augmentations: {
    estCalculable: boolean;
    note: number;
  };
  "augmentations-et-promotions": {
    estCalculable: boolean;
    note: number;
  };
  "conges-maternite": {
    estCalculable: boolean;
    note: number;
  };
  "hautes-remunerations": {
    estCalculable: boolean;
    note: number;
  };
  promotions: {
    estCalculable: boolean;
    note: number;
  };
  remunerations: {
    estCalculable: boolean;
    note: number;
  };
};

type ComputerDeclarationOutput = {
  index?: number;
  note: {
    augmentations: number;
    "augmentations-et-promotions": number;
    "conges-maternite": number;
    "hautes-remunerations": number;
    promotions: number;
    remunerations: number;
  };
  points: number;
  pointsCalculables: number;
};

//TODO

// export const computeIndex2 = (
//   input: ComputerDeclarationInput,
// ): { index: number | undefined; points: number; pointsCalculables: number } => {
//   let points = 0;
//   let max = 0;

//   if (input.remunerations.estCalculable) {
//     points += input.remunerations.note || 0;
//     max += indicatorNoteMax.remunerations;
//   }

//   if (formState.entreprise?.tranche === "50:250") {
//     if (formState["augmentations-et-promotions"]?.estCalculable === "oui") {
//       points += formState["augmentations-et-promotions"].note;
//       max += indicatorNoteMax["augmentations-et-promotions"];
//     }
//   } else {
//     if (formState["augmentations"]?.estCalculable === "oui") {
//       points += formState["augmentations"].note;
//       max += indicatorNoteMax["augmentations"];
//     }
//     if (formState["promotions"]?.estCalculable === "oui") {
//       points += formState["promotions"].note;
//       max += indicatorNoteMax["promotions"];
//     }
//   }

//   if (formState["conges-maternite"]?.estCalculable === "oui") {
//     points += formState["conges-maternite"].note;
//     max += indicatorNoteMax["conges-maternite"];
//   }

//   points += formState["hautes-remunerations"]?.note || 0;
//   max += indicatorNoteMax["hautes-remunerations"];

//   return {
//     points,
//     pointsCalculables: max,
//     index: max >= 75 ? Math.round((points / max) * 100) : undefined, // undefined means "Non calculable".
//   };
// };
