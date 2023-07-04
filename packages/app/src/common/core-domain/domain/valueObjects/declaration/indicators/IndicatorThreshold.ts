// Thresholds are of form {threshold: note}

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
