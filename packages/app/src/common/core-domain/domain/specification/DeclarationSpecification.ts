import { AbstractSpecification, ValidationError } from "@common/shared-domain";
import { findDuplicates } from "@common/utils/array";
import { Object } from "@common/utils/overload";

import type { DeclarationData } from "../DeclarationData";
import { RemunerationsMode } from "../valueObjects/declaration/indicators/RemunerationsMode";

const GOOD_INDEX_THRESHOLD = 85;
const CORRECTIVE_MEASURES_INDEX_THRESHOLD = 75;
const NO_INDEX = -1;
const OPMC_YEAR = 2021;
const RECOVERY_PLAN_YEAR = 2021;
const MANDATORY_MODALITIES_YEAR = 2020;

export class DeclarationSpecification extends AbstractSpecification<DeclarationData> {
  public isSatisfiedBy(data: DeclarationData): boolean {
    this.assertDeclarationWithoutMissingFields(data);
    this.assertNotASufficientPeriod(data);
    this.assertOpmc(data);
    this.assertOpmcValidDate(data);
    this.assertPublishDateModalitiesAndUrl(data);
    this.assertCorrectiveMesures(data);
    this.assertReferencePeriodYear(data);
    this.assertCompanyWorkforce(data);
    this.assertMandatoryRecoveryPlanAfter2021(data);
    this.assertIndicatorsResult(data);
    this.assertIndicators123Result0(data);
    this.assertUesSirenValidation(data);
    this.assertRemunerationIndicator(data);
    this.assertSalaryRaisesAndPromotionsIndicator(data);
    this.assertHighRemunerationsIndicator(data);

    return true;
  }

  /**
   * Rule 1
   */
  private assertDeclarationWithoutMissingFields(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;

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

  /**
   * Rule 2
   */
  private assertNotASufficientPeriod(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;

    if (!data.declaration.sufficientPeriod && data.indicators) {
      throw new DeclarationSpecificationError("La période de référence ne permet pas de définir des indicateurs.");
    }
  }

  /**
   * Rule 3
   */
  private assertOpmc(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;

    const index = data.declaration.index?.getValue() ?? NO_INDEX;
    const year = data.declaration.indicatorsYear.getValue();
    if (year < OPMC_YEAR || index === NO_INDEX || index >= GOOD_INDEX_THRESHOLD) {
      const baseMsg = `si l'année de déclaration précède ${OPMC_YEAR} et si l'index est supérieur ou égal à ${GOOD_INDEX_THRESHOLD}.`;
      if (data.indicators?.remunerations?.progressObjective) {
        throw new DeclarationExtraFieldError(
          `L'objectif de progression de l'Indicateur des Rémunérations ne doit pas être défini ${baseMsg}`,
        );
      }
      if (data.indicators?.salaryRaises?.progressObjective) {
        throw new DeclarationExtraFieldError(
          `L'objectif de progression de l'Indicateur des Augmentations ne doit pas être défini ${baseMsg}`,
        );
      }
      if (data.indicators?.promotions?.progressObjective) {
        throw new DeclarationExtraFieldError(
          `L'objectif de progression de l'Indicateur des Promotions ne doit pas être défini ${baseMsg}`,
        );
      }
      if (data.indicators?.salaryRaisesAndPromotions?.progressObjective) {
        throw new DeclarationExtraFieldError(
          `L'objectif de progression de l'Indicateur des Augmentations et Promotions ne doit pas être défini ${baseMsg}`,
        );
      }
      if (data.indicators?.maternityLeaves?.progressObjective) {
        throw new DeclarationExtraFieldError(
          `L'objectif de progression de l'Indicateur des Congés Maternités ne doit pas être défini ${baseMsg}`,
        );
      }
      if (data.indicators?.highRemunerations?.progressObjective) {
        throw new DeclarationExtraFieldError(
          `L'objectif de progression de l'Indicateur des Hautes Rémunérations ne doit pas être défini ${baseMsg}`,
        );
      }

      if (data.declaration.publication?.measuresPublishDate) {
        throw new DeclarationExtraFieldError(`La date de publication des mesures ne doit pas être défini ${baseMsg}`);
      }

      if (data.declaration.publication?.objectivesPublishDate) {
        throw new DeclarationExtraFieldError(`La date de publication des objectifs ne doit pas être défini ${baseMsg}`);
      }

      if (data.declaration.publication?.objectivesMeasuresModalities) {
        throw new DeclarationExtraFieldError(
          `Les modalités des objectifs et mesures ne doivent pas être définis ${baseMsg}`,
        );
      }
    }

    if (year >= OPMC_YEAR && index >= GOOD_INDEX_THRESHOLD) {
      if (data.declaration.publication?.objectivesMeasuresModalities) {
        throw new DeclarationExtraFieldError(
          `les modalités des objectifs et mesures ne doivent pas être définis si l'index est supérieur à ${GOOD_INDEX_THRESHOLD}.`,
        );
      }
    }
  }

  /**
   * Rule 4 & 5
   */
  private assertOpmcValidDate(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;
    const measuresPublishDate = data.declaration.publication?.measuresPublishDate;
    if (!measuresPublishDate) return;
    const objectivesPublishDate = data.declaration.publication.objectivesPublishDate;
    if (!objectivesPublishDate) return;

    const year = data.declaration.indicatorsYear.getValue();
    // TODO uncouple
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence validated by another rule
    const referencePeriode = data.declaration.endReferencePeriod!;
    if (year >= OPMC_YEAR) {
      if (measuresPublishDate < referencePeriode) {
        throw new DeclarationBadFieldError(
          "La date de publication des mesures doit être postérieure à la fin de la période de référence.",
        );
      }

      if (objectivesPublishDate < referencePeriode) {
        throw new DeclarationBadFieldError(
          "La date de publication des objectifs doit être postérieure à la fin de la période de référence.",
        );
      }
    }
  }

  /**
   * Rule 6
   */
  private assertPublishDateModalitiesAndUrl(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;

    const year = data.declaration.indicatorsYear.getValue();
    const index = data.declaration.index?.getValue() ?? NO_INDEX;
    if (year >= MANDATORY_MODALITIES_YEAR || index === NO_INDEX) {
      if (!data.declaration.publication?.date) {
        throw new DeclarationMissingFieldError("La date de publication doit être définie.");
      }

      if (!data.declaration.publication.modalities || data.declaration.publication.url) {
        new DeclarationMissingFieldError("Les modalités de publication ou le sirte Internet doit être défini.");
      }
    }
  }

  /**
   * Rule 7, 8, & 9
   */
  private assertCorrectiveMesures(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;

    const index = data.declaration.index?.getValue() ?? NO_INDEX;
    if (index === NO_INDEX) {
      if (data.declaration.correctiveMeasures)
        throw new DeclarationExtraFieldError(
          "Les mesures correctives ne doivent pas être définis si l'index n'est pas calculable",
        );
    } else if (index >= CORRECTIVE_MEASURES_INDEX_THRESHOLD) {
      if (data.declaration.correctiveMeasures)
        throw new DeclarationExtraFieldError(
          `Les mesures correctives ne doivent pas être définies pour un index de ${CORRECTIVE_MEASURES_INDEX_THRESHOLD} ou plus.`,
        );
    } else {
      if (!data.declaration.correctiveMeasures)
        throw new DeclarationMissingFieldError(
          `Les mesures correctives doivent être définies pour un index inférieur à ${CORRECTIVE_MEASURES_INDEX_THRESHOLD}.`,
        );
    }
  }

  /**
   * Rule 10
   */
  private assertReferencePeriodYear(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;

    if (!data.declaration.endReferencePeriod) {
      throw new DeclarationMissingFieldError("La fin de période de référence doit être définie.");
    }

    const endReferencePeriodYear = data.declaration.endReferencePeriod?.getFullYear();
    if (data.declaration.indicatorsYear.getValue() !== endReferencePeriodYear) {
      throw new DeclarationBadFieldError(
        "L'année de la date de fin de période ne peut pas être différente de l'année au titre de laquelle les indicateurs sont calculés.",
      );
    }
  }

  /**
   * Rule 11 & 12
   */
  private assertCompanyWorkforce(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;
    const range = data.company.workforce?.range?.getValue();

    const indicatorSalaryRaises = data.indicators?.salaryRaises; // indic 2
    const indicatorPromotions = data.indicators?.promotions; // indic 3
    const indicatorSalaryRaisesAndPromotions = data.indicators?.salaryRaisesAndPromotions; // indic 2&3

    if (range === "50:250") {
      if (indicatorSalaryRaises) {
        throw new DeclarationExtraFieldError(
          "L'indicateur des augmentations ne doit pas être défini pour la tranche 50 à 250.",
        );
      }

      if (indicatorPromotions) {
        throw new DeclarationExtraFieldError(
          "L'indicateur des promotions ne doit pas être défini pour la tranche 50 à 250.",
        );
      }

      if (!indicatorSalaryRaisesAndPromotions) {
        throw new DeclarationMissingFieldError(
          "L'indicateur des augmentations et promotions doit être défini pour la tranche 50 à 250.",
        );
      }
    } else {
      if (indicatorSalaryRaisesAndPromotions) {
        throw new DeclarationExtraFieldError(
          "L'indicateur des augmentations et promotions ne peut être défini que pour la tranche 50 à 250.",
        );
      }

      if (!indicatorSalaryRaises) {
        throw new DeclarationMissingFieldError("L'indicateur des augmentations doit être défini.");
      }

      if (!indicatorPromotions) {
        throw new DeclarationMissingFieldError("L'indicateur des promotions doit être défini.");
      }
    }
  }

  /**
   * Rule 13
   */
  private assertMandatoryRecoveryPlanAfter2021(data: DeclarationData): asserts data {
    if (!data.declaration.draft && !data.declaration.sufficientPeriod) return;

    if (data.declaration.indicatorsYear.getValue() >= RECOVERY_PLAN_YEAR) {
      if (typeof data.company.hasRecoveryPlan === "undefined") {
        throw new DeclarationMissingFieldError(
          `Le plan de relance doit être défini pour une date de déclaration après ${RECOVERY_PLAN_YEAR} incluse.`,
        );
      }
    }
  }

  /**
   * Rule 14 & 15 & 16
   */
  private assertIndicatorsResult(data: DeclarationData): asserts data {
    const indicators = data.indicators?.getAllIndicators() ?? [];
    const indicatorName = [
      "rémunérations",
      "augmentations",
      "promotions",
      "augmentations et promotions",
      "congés maternité",
      "hautes rémunérations",
    ];
    for (let i = 0; i < indicators.length; i++) {
      const indicator = indicators[i];
      if (!indicator) continue;
      if ("notComputableReason" in indicator && indicator.notComputableReason) {
        if (Object.keys(indicator).length !== 1) {
          throw new DeclarationExtraFieldError(
            `L'indicator des ${indicatorName[i]} doit être vide s'il n'est pas calculable.`,
          );
        }
      } else {
        const result = indicator.result;
        // TODO change when front simulation does not save in API anymore
        if (i === 0 || ("favorablePopulation" in indicator && indicator.favorablePopulation)) {
          if (!result) {
            // The "rémunérations" indicator is sent through several steps
            // on the "formulaire" frontend. The only way the "formulaire"
            // sent all its data is if there's a `population_favorable`
            // field. However, this latter field is only provided if the
            // `résultat` is not `0`.
            throw new DeclarationMissingFieldError(
              `Le résultat de l'indicateur des ${indicatorName[i]} doit être défini si l'indicateur est lui même calculable.`,
            );
          }
        }
      }
    }
  }

  /**
   * Rule 17
   */
  private assertIndicators123Result0(data: DeclarationData): asserts data {
    const remunerations = data.indicators?.remunerations;
    const salaryRaises = data.indicators?.salaryRaises;
    const promotions = data.indicators?.promotions;

    if (remunerations?.result?.getValue() === 0) {
      if (remunerations.favorablePopulation) {
        throw new DeclarationExtraFieldError(
          "La population favorable pour l'indicateur des rémunarations doit être vide si le résultat est 0.",
        );
      }
    }

    if (salaryRaises?.result?.getValue() === 0) {
      if (salaryRaises.favorablePopulation) {
        throw new DeclarationExtraFieldError(
          "La population favorable pour l'indicateur des augmentations doit être vide si le résultat est 0.",
        );
      }
    }

    if (promotions?.result?.getValue() === 0) {
      if (promotions.favorablePopulation) {
        throw new DeclarationExtraFieldError(
          "La population favorable pour l'indicateur des promotions doit être vide si le résultat est 0.",
        );
      }
    }
  }

  /**
   * Rule 18 & 19
   */
  private assertUesSirenValidation(data: DeclarationData): asserts data {
    if (!data.company.ues) return;

    const uesSirenList = data.company.ues.companies.map(company => company.siren.getValue());
    const duplicates = findDuplicates(uesSirenList);

    if (duplicates.length) {
      throw new DeclarationBadFieldError(
        `La liste des entreprises de l'UES comporte des Siren en double : ${duplicates.join(",")}`,
      );
    }

    if (uesSirenList.includes(data.company.siren.getValue())) {
      throw new DeclarationBadFieldError(
        `L'entreprise déclarante ne doit pas être dupliquée dans les entreprises de l'UES.`,
      );
    }

    if (!data.company.ues.companies.length && data.company.ues.name) {
      throw new DeclarationExtraFieldError("Une entreprise ne doit pas avoir de nom d'UES.");
    }
  }

  /**
   * Rule 20
   */
  private assertRemunerationIndicator(data: DeclarationData): asserts data {
    const remunerations = data.indicators?.remunerations;
    if (!remunerations) return;

    if (remunerations.notComputableReason && remunerations.mode?.getValue() === RemunerationsMode.Enum.CSP) {
      if (remunerations.cseConsultationDate) {
        throw new DeclarationExtraFieldError(
          "La date de consultation du CSE ne doit pas être défini dans l'indicateur des rémunérations si il est en mode CSP (Catégorie Socio-Professionnelle).",
        );
      }
    }
  }

  /**
   * Rule 21
   */
  private assertSalaryRaisesAndPromotionsIndicator(data: DeclarationData): asserts data {
    const salaryRaisesAndPromotions = data.indicators?.salaryRaisesAndPromotions;
    if (!salaryRaisesAndPromotions) return;

    if (
      salaryRaisesAndPromotions.result?.getValue() === 0 &&
      salaryRaisesAndPromotions.employeesCountResult?.getValue() === 0
    ) {
      if (salaryRaisesAndPromotions.favorablePopulation) {
        throw new DeclarationExtraFieldError(
          "La population favorable ne doit pas être définie pour l'indicateur des augmentations et promotions si le résultat et le résultat final en nombre équivalent de salariés sont tous les deux égales à 0.",
        );
      }
    }
  }

  /**
   * Rule 22
   */
  private assertHighRemunerationsIndicator(data: DeclarationData): asserts data {
    const highRemunerations = data.indicators?.highRemunerations;
    if (!highRemunerations) return;

    if (highRemunerations.result?.getValue() === 5) {
      if (highRemunerations.favorablePopulation) {
        throw new DeclarationExtraFieldError(
          "La population favorable ne doit pas être définie pour l'indicateur des hautes rémunérations si le résultat est égale à 5.",
        );
      }
    }
  }
}

export class DeclarationSpecificationError extends ValidationError {}
export class DeclarationMissingFieldError extends DeclarationSpecificationError {}
export class DeclarationExtraFieldError extends DeclarationSpecificationError {}
export class DeclarationBadFieldError extends DeclarationSpecificationError {}
