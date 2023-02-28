import { Percentage, PositiveInteger, PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";

import type { DeclarationData } from "../DeclarationData";
import { DeclarationIndex } from "../valueObjects/declaration/declarationInfo/DeclarationIndex";
import type { FavorablePopulation } from "../valueObjects/declaration/indicators/FavorablePopulation";

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

const computeSingleScore = (result: number, thresholds: ScoreThreshold): number => {
  let previous = 0;
  for (const [threshold, score] of Object.entries(thresholds)) {
    if (result >= threshold) {
      previous = score;
    }
  }

  return previous;
};

const getMaxScore = (thresholds: ScoreThreshold) => Math.max(...Object.values(thresholds));

export const computeScores = (data: DeclarationData) => {
  if (!data.indicators) {
    return;
  }

  let favorablePopulation: FavorablePopulation | undefined;
  let totalScore = 0;
  let totalMaxScore = 0;

  // indic 1
  const remunerations = data.indicators.remunerations;
  if (remunerations && !remunerations.notComputableReason) {
    const result = remunerations.result;
    if (result) {
      const maxScore = getMaxScore(REMUNERATIONS_INDICATOR_THRESHOLD);
      totalMaxScore += maxScore;
      const score = computeSingleScore(result.getValue(), REMUNERATIONS_INDICATOR_THRESHOLD);
      if (score < maxScore) {
        favorablePopulation = remunerations.favorablePopulation;
      }

      remunerations.setScore(new PositiveInteger(score));
      totalScore += score;
    }
  }

  // indic 2
  const salaryRaises = data.indicators.salaryRaises;
  if (salaryRaises && !salaryRaises.notComputableReason) {
    const result = salaryRaises.result;
    if (result) {
      const maxScore = getMaxScore(SALARY_RAISES_INDICATOR_THRESHOLD);
      totalMaxScore += maxScore;
      let score = computeSingleScore(result.getValue(), SALARY_RAISES_INDICATOR_THRESHOLD);

      const currentFavorablePopulation = salaryRaises.favorablePopulation;
      if (favorablePopulation && currentFavorablePopulation?.equals(favorablePopulation)) {
        score = maxScore;
      }

      salaryRaises.setScore(new PositiveInteger(score));
      totalScore += score;
    }
  }

  // indic 3
  const promotions = data.indicators.promotions;
  if (promotions && !promotions.notComputableReason) {
    const result = promotions.result;
    if (result) {
      const maxScore = getMaxScore(PROMOTIONS_INDICATOR_THRESHOLD);
      totalMaxScore += maxScore;
      let score = computeSingleScore(result.getValue(), PROMOTIONS_INDICATOR_THRESHOLD);

      const currentFavorablePopulation = promotions.favorablePopulation;
      if (favorablePopulation && currentFavorablePopulation?.equals(favorablePopulation)) {
        score = maxScore;
      }

      promotions.setScore(new PositiveInteger(score));
      totalScore += score;
    }
  }

  // indic 2&3
  const salaryRaisesAndPromotions = data.indicators.salaryRaisesAndPromotions;
  if (salaryRaisesAndPromotions && !salaryRaisesAndPromotions.notComputableReason) {
    const result = salaryRaisesAndPromotions.result;

    if (result) {
      const percentScore = computeSingleScore(result.getValue(), SALARY_RAISES_AND_PROMOTIONS_INDICATOR_THRESHOLD);
      salaryRaisesAndPromotions.setPercentScore(new Percentage(percentScore));
    }

    const employeesCountResult = salaryRaisesAndPromotions.employeesCountResult;
    if (employeesCountResult) {
      const employeesCountScore = computeSingleScore(
        employeesCountResult.getValue(),
        SALARY_RAISES_AND_PROMOTIONS_INDICATOR_THRESHOLD,
      );
      salaryRaisesAndPromotions.setEmployeesCountScore(new PositiveInteger(employeesCountScore));
    }

    if (result && employeesCountResult) {
      const maxScore = getMaxScore(SALARY_RAISES_AND_PROMOTIONS_INDICATOR_THRESHOLD);
      totalMaxScore += maxScore;
      let score = Math.max(
        salaryRaisesAndPromotions.percentScore?.getValue() ?? 0,
        salaryRaisesAndPromotions.employeesCountScore?.getValue() ?? 0,
      );

      const currentFavorablePopulation = salaryRaisesAndPromotions.favorablePopulation;
      if (favorablePopulation && currentFavorablePopulation?.equals(favorablePopulation)) {
        score = maxScore;
      }

      salaryRaisesAndPromotions.setScore(new PositiveInteger(score));
      totalScore += score;
    }
  }

  // indic 4
  const maternityLeaves = data.indicators.maternityLeaves;
  if (maternityLeaves && !maternityLeaves.notComputableReason) {
    const result = maternityLeaves.result;
    if (result) {
      const score = result.isMax() ? MATERNITY_LEAVES_INDICATOR_THRESHOLD : 0;
      totalMaxScore += MATERNITY_LEAVES_INDICATOR_THRESHOLD;
      maternityLeaves.setScore(new PositiveInteger(score));
      totalScore += score;
    }
  }

  // indic 5
  const highRemunerations = data.indicators.highRemunerations;
  if (highRemunerations) {
    const result = highRemunerations.result;
    if (result) {
      const maxScore = getMaxScore(HIGH_REMUNERATIONS_INDICATOR_THRESHOLD);
      totalMaxScore += maxScore;

      const score = computeSingleScore(result.getValue(), HIGH_REMUNERATIONS_INDICATOR_THRESHOLD);
      highRemunerations.setScore(new PositiveInteger(score));
      totalScore += score;
    }
  }

  // global
  data.declaration.setPoints(new PositiveNumber(totalScore));
  data.declaration.setComputablePoints(new PositiveNumber(totalMaxScore));

  if (totalMaxScore >= 75) {
    data.declaration.setIndex(new DeclarationIndex(Math.round((totalScore / totalMaxScore) * 100)));
  }
};
