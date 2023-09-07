import { AbstractSpecification, ValidationError } from "@common/shared-domain";

import { type DeclarationData } from "../DeclarationData";

const GOOD_INDEX_THRESHOLD = 85;
const NO_INDEX = -1;

export class DeclarationSpecification extends AbstractSpecification<DeclarationData> {
  private _lastError?: ValidationError;

  public isSatisfiedBy(data: DeclarationData): boolean {
    try {
      if (data.declaration.draft) {
        this.assertRequiredFields(data);
      }

      if (!data.declaration.sufficientPeriod) {
        if (data.indicators)
          throw new DeclarationSpecificationError("La période de référence ne permet pas de définir des indicateurs.");
      } else {
        this.assertIndicators(data);
      }
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        this._lastError = error;
        return false;
      } else {
        throw error;
      }
    }

    return true;
  }

  get lastError() {
    return this._lastError;
  }

  private assertRequiredFields(data: DeclarationData): asserts data {
    const baseMsg = "est obligatoire lorsque la déclaration n'est pas en brouillon";
    if (!data.company.nafCode) {
      throw new DeclarationMissingFieldError(`Le code NAF de l'entreprise ${baseMsg}`);
    }

    if (!data.declarant.firstname) {
      throw new DeclarationMissingFieldError(`Le prénom du déclarant ${baseMsg}`);
    }

    if (!data.declarant.lastname) {
      throw new DeclarationMissingFieldError(`Le nom de famille du déclarant ${baseMsg}`);
    }

    if (!data.declarant.phone) {
      throw new DeclarationMissingFieldError(`Le numéro de téléphone du déclarant ${baseMsg}`);
    }
  }

  private assertIndicators(data: DeclarationData): asserts data {
    const corectiveMeasures = data.declaration.correctiveMeasures;
    const index = data.declaration.index?.getValue() ?? NO_INDEX;

    const year = data.declaration.indicatorsYear.getValue();
    this.assertIndicatorsObjectives(data);
    this.assertIndicatorsDates(data);
  }

  private assertIndicatorsObjectives(data: DeclarationData): asserts data {
    // const index = data.declaration.index?.getValue() ?? NO_INDEX;
    // const year = data.declaration.indicatorsYear.getValue();
    // if (year < CURRENT_YEAR || index === NO_INDEX || index >= GOOD_INDEX_THRESHOLD) {
    //   const baseMsg = `si l'année de déclaration précède ${CURRENT_YEAR} et si l'index est supérieur ou égal à ${GOOD_INDEX_THRESHOLD}.`;
    //   if (data.indicators.remunerations.progressObjective) {
    //     throw new DeclarationExtraFieldError(
    //       `L'objectif de progression de l'Indicateur des Rémunérations ne doit pas être défini ${baseMsg}`,
    //     );
    //   }
    //   if (data.indicators.salaryRaises.progressObjective) {
    //     throw new DeclarationExtraFieldError(
    //       `L'objectif de progression de l'Indicateur des Augmentations ne doit pas être défini ${baseMsg}`,
    //     );
    //   }
    //   if (data.indicators.promotions.progressObjective) {
    //     throw new DeclarationExtraFieldError(
    //       `L'objectif de progression de l'Indicateur des Promotions ne doit pas être défini ${baseMsg}`,
    //     );
    //   }
    //   if (data.indicators.salaryRaisesAndPromotions.progressObjective) {
    //     throw new DeclarationExtraFieldError(
    //       `L'objectif de progression de l'Indicateur des Augmentations et Promotions ne doit pas être défini ${baseMsg}`,
    //     );
    //   }
    //   if (data.indicators.maternityLeaves.progressObjective) {
    //     throw new DeclarationExtraFieldError(
    //       `L'objectif de progression de l'Indicateur des Congés Maternités ne doit pas être défini ${baseMsg}`,
    //     );
    //   }
    //   if (data.indicators.highRemunerations.progressObjective) {
    //     throw new DeclarationExtraFieldError(
    //       `L'objectif de progression de l'Indicateur des Hautes Rémunérations ne doit pas être défini ${baseMsg}`,
    //     );
    //   }
    //   //
    //   if (data.declaration.publication.objectivesMeasuresModalities) {
    //     throw new DeclarationExtraFieldError(
    //       `Les modalités des objectifs et mesures ne doivent pas être définis ${baseMsg}`,
    //     );
    //   }
    //   //
    //   if (year >= CURRENT_YEAR) {
    //     if (index >= GOOD_INDEX_THRESHOLD) {
    //       if (data.declaration.publication.objectivesMeasuresModalities) {
    //         throw new DeclarationExtraFieldError(
    //           `les modalités des objectifs et mesures ne doivent pas être définis si l'index est supérieur à ${GOOD_INDEX_THRESHOLD}.`,
    //         );
    //       }
    //     }
    //   }
    // }
  }

  private assertIndicatorsDates(data: DeclarationData): asserts data {
    // const index = data.declaration.index?.getValue() ?? -1;
    // const year = data.declaration.indicatorsYear.getValue();
    // if (year < CURRENT_YEAR || index === NO_INDEX || index >= GOOD_INDEX_THRESHOLD) {
    //   const baseMsg = `si l'année de déclaration précède ${CURRENT_YEAR} et si l'index est supérieur ou égal à ${GOOD_INDEX_THRESHOLD}.`;
    //   if (data.declaration.publication.measuresPublishDate) {
    //     throw new DeclarationExtraFieldError(`La date de publication des mesures ne doit pas être défini ${baseMsg}`);
    //   }
    //   if (data.declaration.publication.objectivesPublishDate) {
    //     throw new DeclarationExtraFieldError(`La date de publication des objectifs ne doit pas être défini ${baseMsg}`);
    //   }
    // }
    // if (year >= CURRENT_YEAR) {
    //   if (index >= GOOD_INDEX_THRESHOLD) {
    //     // if (data.)
    //   }
    // }
    // if (year >= CURRENT_YEAR - 1 || index > NO_INDEX) {
    //   if (data.declaration.publication.date) {
    //   }
    // }
  }
}

export class DeclarationSpecificationError extends ValidationError {}
export class DeclarationMissingFieldError extends DeclarationSpecificationError {}
export class DeclarationExtraFieldError extends DeclarationSpecificationError {}
