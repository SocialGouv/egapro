import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { AbstractSpecification, ValidationError } from "@common/shared-domain";
import { type Percentage } from "@common/shared-domain/domain/valueObjects";
import assert, { AssertionError } from "assert";
import { isAfter } from "date-fns";

import { type DeclarationOpmc } from "../DeclarationOpmc";

const OBJECTIVES_THRESHOLD = 85;

/**
 * Specification for declarationOpmc.Declaration.
 * See : https://github.com/SocialGouv/egapro/issues/1767
 */
export class DeclarationOpmcSpecification extends AbstractSpecification<DeclarationOpmc> {
  private _lastError?: ValidationError;

  public isSatisfiedBy(declarationOpmc: DeclarationOpmc): boolean {
    console.debug("declaration dans specification:", JSON.stringify(declarationOpmc, null, 2));

    try {
      type IndicatorRule17 = { progressObjective?: string; result?: Percentage } | undefined;
      const indicators17 = [
        [declarationOpmc.declaration.remunerations, "rémunérations"],
        [declarationOpmc.declaration.salaryRaises, "augmentations"],
        [declarationOpmc.declaration.promotions, "promotions"],
        [declarationOpmc.declaration.salaryRaisesAndPromotions, "augmentations et promotions"],
        [declarationOpmc.declaration.maternityLeaves, "congés maternité"],
      ] as Array<[IndicatorRule17, string]>;
      // Règle 17 - Cas d'absences des objectifs de progression
      if (
        declarationOpmc.declaration.year.getValue() < 2021 ||
        !declarationOpmc.declaration.index ||
        declarationOpmc.declaration.index.getValue() >= OBJECTIVES_THRESHOLD ||
        !declarationOpmc.declaration.sufficientPeriod
      ) {
        for (const [indicator, name] of indicators17) {
          assert(
            indicator?.progressObjective === undefined,
            `L'objectif de progression pour l'indicateur ${name} doit être absent.`,
          );
        }
        assert(
          declarationOpmc.measuresPublishDate === undefined,
          "La date de publication des mesures doit être absente.",
        );
        assert(
          declarationOpmc.objectivesPublishDate === undefined,
          "La date de publication des objectifs doit être absente.",
        );
        assert(
          declarationOpmc.objectivesMeasuresModalities === undefined,
          "Les modalités des objectifs mesures doivent être absentes.",
        );
      }
      // Règle 18 - Date de publication des objectifs de progression
      if (
        declarationOpmc.declaration.year.getValue() >= 2021 &&
        declarationOpmc.declaration.index &&
        declarationOpmc.declaration.index.getValue() <= 85 &&
        declarationOpmc.declaration.sufficientPeriod &&
        declarationOpmc.declaration.endReferencePeriod // if sufficientPeriod is true, endReferencePeriod is defined.
      ) {
        assert(
          declarationOpmc.objectivesPublishDate !== undefined,
          "La date de publication des objectifs de progression doit être renseignée.",
        );
        assert(
          isAfter(declarationOpmc.objectivesPublishDate, declarationOpmc.declaration.endReferencePeriod),
          "La date de publication des objectifs de progression doit être postérieure à la fin de période de référence.",
        );
      }
      // Règle 19 - Date de publication des mesures
      if (
        declarationOpmc.declaration.year.getValue() >= 2021 &&
        declarationOpmc.declaration.index &&
        declarationOpmc.declaration.index.getValue() < 75 &&
        declarationOpmc.declaration.sufficientPeriod &&
        declarationOpmc.declaration.endReferencePeriod // if sufficientPeriod is true, endReferencePeriod is defined.
      ) {
        assert(
          declarationOpmc.measuresPublishDate !== undefined,
          "La date de publication des mesures doit être renseignée.",
        );
        assert(
          isAfter(declarationOpmc.measuresPublishDate, declarationOpmc.declaration.endReferencePeriod),
          "La date de publication des mesures doit être postérieure à la fin de période de référence.",
        );
      }
      // Règle 20 - Présence des modalités des objectifs et mesures
      if (
        declarationOpmc.declaration.year.getValue() >= 2021 &&
        declarationOpmc.declaration.index &&
        declarationOpmc.declaration.index.getValue() < 75 &&
        !declarationOpmc.declaration.publication?.url
      ) {
        assert(
          declarationOpmc.objectivesMeasuresModalities !== undefined,
          "Les modalités des objectifs mesures doivent être renseignées.",
        );
      }
      // Règle 20 bis - Absence des modalités des objectifs et mesures pour les entreprises publiant sur internet dont l'année est supérieure ou égal à 2021
      if (
        declarationOpmc.declaration.year.getValue() >= 2021 &&
        declarationOpmc.declaration.index &&
        declarationOpmc.declaration.index.getValue() >= 75 &&
        declarationOpmc.declaration.index.getValue() <= 85 &&
        declarationOpmc.declaration.publication?.url
      ) {
        assert(
          declarationOpmc.objectivesMeasuresModalities === undefined,
          "Les modalités des objectifs mesures doivent être absentes.",
        );
      }
      type IndicatorRule20 =
        | { notComputableReason?: string; progressObjective?: string; result?: Percentage }
        | undefined;
      const indicators20 = [
        [declarationOpmc.declaration.remunerations, "rémunérations", indicatorNoteMax.remunerations],
        [declarationOpmc.declaration.salaryRaises, "augmentations", indicatorNoteMax.augmentations],
        [declarationOpmc.declaration.promotions, "promotions", indicatorNoteMax.promotions],
        [declarationOpmc.declaration.salaryRaisesAndPromotions, indicatorNoteMax["augmentations-et-promotions"]],
        [declarationOpmc.declaration.maternityLeaves, "congés maternité", indicatorNoteMax["conges-maternite"]],
      ] as Array<[IndicatorRule20, string, number]>;
      // Règle 21 - Absence d'un objectif pour un indicateur
      if (declarationOpmc.declaration.year.getValue() >= 2021) {
        for (const [indicator, name, max] of indicators20) {
          if (indicator?.notComputableReason || indicator?.result?.getValue() === max) {
            assert(
              indicator.progressObjective === undefined,
              `L'objectif de progression pour l'indicateur ${name} doit être absent.`,
            );
          }
        }
      }
      // Règle 21 bis - Présence d'un objectif pour un indicateur
      if (
        declarationOpmc.declaration.year.getValue() >= 2021 &&
        declarationOpmc.declaration.index &&
        declarationOpmc.declaration.index.getValue() <= 85 &&
        declarationOpmc.declaration.sufficientPeriod
      ) {
        for (const [indicator, name, max] of indicators20) {
          if (!indicator?.notComputableReason && indicator?.result?.getValue() && indicator?.result?.getValue() < max) {
            assert(
              indicator.progressObjective !== undefined,
              `L'objectif de progression pour l'indicateur ${name} doit être renseigné.`,
            );
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        this._lastError = new DeclarationOpmcSpecificationError(error.message);
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
}

export class DeclarationOpmcSpecificationError extends ValidationError {}
export class DeclarationOpmcMissingFieldError extends DeclarationOpmcSpecificationError {}
export class DeclarationOpmcExtraFieldError extends DeclarationOpmcSpecificationError {}
