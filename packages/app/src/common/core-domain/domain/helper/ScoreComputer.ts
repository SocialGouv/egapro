import type { DeclarationData } from "../DeclarationData";

interface ScoreThreshold {
  [P: number]: number;
}
/** si résultat <= array index: donne la valeur en tant que note. */
const REMUNERATIONS_INDICATOR_THRESHOLD: ScoreThreshold = {};
[40, 39, 38, 37, 36, 35, 34, 33, 31, 29, 27, 25, 23, 21, 19, 17, 14, 11, 8, 5, 2, 0].forEach((score, currentIndex) => {
  REMUNERATIONS_INDICATOR_THRESHOLD[currentIndex] = score;
});

/** si résultat <= clef: donne la valeur en tant que note. Sinon 0. */
const SALARY_RAISES_INDICATOR_THRESHOLD: ScoreThreshold = {
  2: 20,
  5: 10,
  10: 5,
};

/** si résultat <= clef: donne la valeur en tant que note. Sinon 0. */
const PROMOTIONS_INDICATOR_THRESHOLD: ScoreThreshold = {
  2: 15,
  5: 10,
  10: 5,
};

/** si résultat ou nombre salariés <= clef: donne la valeur en tant que note. Sinon 0. */
const SALARY_RAISES_AND_PROMOTIONS_INDICATOR_THRESHOLD: ScoreThreshold = {
  2: 35,
  5: 25,
  10: 15,
};

/** si résultat 100%, sinon 0 */
const MATERNITY_LEAVES_INDICATOR_THRESHOLD = 15;

/** si résultat <= clef: donne la valeur en tant que note. */
const HIGH_REMUNERATIONS_INDICATOR_THRESHOLD: ScoreThreshold = {
  1: 0,
  3: 5,
  5: 10,
};

export const computeScores = (data: DeclarationData) => {
  //   data.indicators.
  //
};
