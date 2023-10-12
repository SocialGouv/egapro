import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { AbstractSpecification, ValidationError } from "@common/shared-domain";
import { type Percentage } from "@common/shared-domain/domain/valueObjects";
import assert, { AssertionError } from "assert";
import { isAfter } from "date-fns";

import { type Declaration } from "../Declaration";
import { CompanyWorkforceRange } from "../valueObjects/declaration/CompanyWorkforceRange";
import { type NotComputableReason } from "../valueObjects/declaration/indicators/NotComputableReason";
import { RemunerationsMode } from "../valueObjects/declaration/indicators/RemunerationsMode";

const OBJECTIVES_THRESHOLD = 85;
const MEASURES_THRESHOLD = 75;

/**
 * Specification for Declaration.
 * See : https://github.com/SocialGouv/egapro/issues/1767
 */
export class DeclarationSpecification extends AbstractSpecification<Declaration> {
  private _lastError?: ValidationError;

  public isSatisfiedBy(declaration: Declaration): boolean {
    // console.log("declaration dans specification:", JSON.stringify(declaration, null, 2));

    try {
      // TODO: confirm year with product owner
      assert(
        declaration.year.getValue() >= 2020 && declaration.year.getValue() <= new Date().getFullYear(),
        "Règle 1 - Assertion année indicateurs",
      );

      // Règle 2 - Assertion champs obligatoiresx
      // siren, year are present by definition but we check them anyway.
      assert(declaration.siren && declaration.year, "Les informations Sirent et année sont obligatoires.");

      assert(
        declaration.declarant.phone &&
          declaration.declarant.firstname &&
          declaration.declarant.lastname &&
          declaration.declarant.email,
        "Les informations sur le déclarant sont obligatoires.",
      );

      assert(
        declaration.company.siren && declaration.company.range,
        "Le Siren de l'entreprise déclarante et la tranche d'entreprise est obligatoire.",
      );

      assert(typeof declaration.company.hasRecoveryPlan !== "undefined", "Le champ plan de relance est obligatoire.");

      assert(typeof declaration.sufficientPeriod !== "undefined", "Le champ période suffisante est obligatoire.");
      // Règle 3 & 3 bis - Relation période non suffisante et indicateurs
      if (!declaration.sufficientPeriod) {
        assert(
          !declaration.salaryRaises &&
            !declaration.salaryRaisesAndPromotions &&
            !declaration.promotions &&
            !declaration.remunerations &&
            !declaration.maternityLeaves &&
            !declaration.highRemunerations,
          "Les indicateurs ne doivent pas être renseignés quand la période n'est pas suffisante.",
        );
      } else {
        if (declaration.company.range?.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
          assert(
            declaration.salaryRaisesAndPromotions,
            "L'indicateur des augmentations et promotions doit être renseigné pour les entreprises de 50 à 250 salariés.",
          );
          assert(
            !declaration.salaryRaises && !declaration.promotions,
            "Les indicateurs des augmentations et celui des promotions doivent être absents pour les entreprises de 50 à 250 salariés.",
          );
        } else {
          assert(
            !declaration.salaryRaisesAndPromotions,
            "L'indicateur des augmentations et promotions doit être absent pour les entreprises de plus de 250 salariés.",
          );
          assert(
            declaration.salaryRaises && declaration.promotions,
            "Les indicateurs des augmentations et celui des promotions doivent être renseignés pour les entreprises de plus de 250 salariés.",
          );
        }

        assert(declaration.remunerations, "L'indicateur des rémunérations doit être renseigné.");
        assert(declaration.maternityLeaves, "L'indicateur des congés maternité doit être renseigné.");
        assert(declaration.highRemunerations, "L'indicateur des hautes rémunérations doit être renseigné.");
      }

      if (declaration.index) {
        // Règle 4 - Assertion date de publication
        assert(
          declaration.publication?.date,
          "la date de publication doit être renseignée quand l'index est calculable",
        );

        const modalitiesPresence = declaration.publication?.modalities ? 1 : 0;
        const urlPresence = declaration.publication?.url ? 1 : 0;

        // Règle 5 - Assertion modalités ou url de publication
        assert(
          modalitiesPresence ^ urlPresence, // XOR operator.
          "Soit les modalités de publication, soit l'url de publication doivent être renseignés mais pas les 2 quand l'index est calculable",
        );

        // Règle 6 - Assertion sur l'année de la fin de période de référence
        assert(
          declaration.endReferencePeriod?.getFullYear() === declaration.year.getValue(),
          "L'année de la fin de période de référence doit correspondre à l'année des indicateurs.",
        );

        if (declaration.company.range.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
          // Règle 7 - Tranche 50-250 et indicateurs
          assert(
            declaration.salaryRaisesAndPromotions,
            "L'indicateur des augmentations et promotions doit être renseigné.",
          );
          assert(!declaration.salaryRaises, "L'indicateur des augmentations doit être absent.");
          assert(!declaration.promotions, "L'indicateur des promotions doit être absent.");
        } else {
          // Règle 7 bis - Tranche !== 50-250 et indicateurs
          assert(declaration.salaryRaises, "L'indicateur des augmentations doit être renseigné.");
          assert(declaration.promotions, "L'indicateur des promotions doit être renseigné.");
          assert(
            !declaration.salaryRaisesAndPromotions,
            "L'indicateur des augmentations et promotions doit être absent.",
          );
        }
        type Indicator = { notComputableReason?: NotComputableReason; result?: Percentage } | undefined;

        const indicators = (() => {
          const base = [
            [declaration.remunerations, "rémunérations"],
            [declaration.maternityLeaves, "congés maternité"],
          ];

          if (declaration.company.range.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
            return [...base, [declaration.salaryRaisesAndPromotions, "augmentations et promotions"]] as Array<
              [Indicator, string]
            >;
          } else {
            return [
              ...base,
              [declaration.salaryRaises, "augmentations"],
              [declaration.promotions, "promotions"],
            ] as Array<[Indicator, string]>;
          }
        })();

        // Règle 8 - Si un indicateur est non calculable, aucune autre information n'est présente
        for (const [indicator, name] of indicators) {
          if (indicator?.notComputableReason) {
            if (indicator) {
              assert(
                Object.keys(indicator).length === 1,
                `Aucune autre information ne doit exister pour l'indicateur ${name} quand il est non calculable.`,
              );
            }
          }
        }

        // Règle 8 bis - Si un indicateur est calculable, le résultat doit être renseigné
        for (const [indicator, name] of indicators) {
          if (!indicator?.notComputableReason) {
            assert(
              indicator?.result !== undefined,
              `Le résultat doit être renseigné pour l'indicateur ${name} quand il est calculable.`,
            );
          }
        }

        type IndicatorRule9 = { favorablePopulation?: string; result?: Percentage } | undefined;

        const indicatorsRule9 = [
          [declaration.remunerations, "rémunérations"],
          [declaration.salaryRaises, "augmentations"],
          [declaration.promotions, "promotions"],
        ] as Array<[IndicatorRule9, string]>;

        // Règle 9 - Population favorable pour les indicateurs rémunérations, augmentations, promotions
        for (const [indicator, name] of indicatorsRule9) {
          if (indicator?.result?.getValue() === 0) {
            assert(
              indicator?.favorablePopulation === undefined,
              `La population favorable doit être absente pour l'indicateur ${name} quand le résultat est 0.`,
            );
          }
        }

        // Règle 10 - Population favorable pour l'indicateur augmentations et promotions
        if (
          declaration.salaryRaisesAndPromotions?.result?.getValue() === 0 &&
          declaration.salaryRaisesAndPromotions?.employeesCountResult?.getValue() === 0
        ) {
          assert(
            declaration.salaryRaisesAndPromotions?.favorablePopulation === undefined,
            "La population favorable doit être absente pour l'indicateur augmentations et promotions quand le résultat est 0 et que le résultat en nombre de salariés est aussi 0.",
          );
        }

        // Règle 11 - Population favorable pour l'indicateur hautes rémunérations
        if (declaration.highRemunerations?.result?.getValue() === 5) {
          assert(
            declaration.highRemunerations?.favorablePopulation === undefined,
            "La population favorable doit être absente pour l'indicateur hautes rémunérations quand le résultat est 5.",
          );
        }

        // Règle 12 - Une UES doit contenir au moins une entreprise
        if (declaration.company.ues) {
          assert(declaration.company.ues.companies?.length > 0, "Une UES doit contenir au moins une entreprise.");

          // Règle 13 - Les Siren d'une UES ne doivent pas être dupliqués
          const sirenSet = new Set(declaration.company.ues.companies.map(company => company.siren.getValue()));
          assert(
            sirenSet.size === declaration.company.ues.companies.length,
            "Les Siren d'une UES ne doivent pas être dupliqués.",
          );

          // Règle 13 bis - Le Siren de l'entreprise déclarante ne doit pas se retrouver dans l'UES
          assert(
            !sirenSet.has(declaration.company.siren.getValue()),
            "Le Siren de l'entreprise déclarante ne doit pas se retrouver dans l'UES.",
          );
        }

        // Règle 14 - Date de consultation CSE absente
        if (declaration.remunerations?.mode?.getValue() === RemunerationsMode.Enum.CSP) {
          assert(
            declaration.remunerations?.cseConsultationDate === undefined,
            "La date de consultation du CSE doit être absente quand le mode de calcul est CSP.",
          );
        }

        // Règle 14 bis - Date de consultation CSE obligatoire pour les modes !== CSP + structure de type UES
        if (
          (declaration.remunerations?.mode?.getValue() === RemunerationsMode.Enum.BRANCH_LEVEL ||
            declaration.remunerations?.mode?.getValue() === RemunerationsMode.Enum.OTHER_LEVEL) &&
          declaration.company.ues
        ) {
          assert(
            declaration.remunerations?.cseConsultationDate !== undefined,
            "La date de consultation du CSE doit être renseignée quand le mode de calcul n'est pas CSP et que la structure est une UES.",
          );
          assert(
            declaration.remunerations?.cseConsultationDate.getFullYear() >= 2018,
            "La date de consultation du CSE doit être postérieure à l'existence d'Egapro (01/01/2018).",
          );
        }

        // Règle 15 - Mode de calcul indicateur rémunération obligatoire
        if (!declaration.remunerations?.notComputableReason) {
          assert(
            declaration.remunerations?.mode,
            "Le mode de calcul de l'indicateur rémunération doit être renseigné.",
          );
        }

        // Règle 16 - Les mesures correctives sont absentes pour un index non calculable ou >= 75
        if (!declaration.index || declaration.index.getValue() >= MEASURES_THRESHOLD) {
          assert(
            declaration.correctiveMeasures === undefined,
            "Les mesures correctives doivent être absentes pour un index non calculable ou >= 75.",
          );
        }

        // Règle 16 bis - Les mesures correctives sont présentes pour un index < 75
        if (declaration.index && declaration.index.getValue() < MEASURES_THRESHOLD) {
          assert(
            declaration.correctiveMeasures !== undefined,
            "Les mesures correctives doivent être renseignées pour un index < 75.",
          );
        }

        type IndicatorRule16 = { progressObjective?: string; result?: Percentage } | undefined;

        const indicators16 = [
          [declaration.remunerations, "rémunérations"],
          [declaration.salaryRaises, "augmentations"],
          [declaration.promotions, "promotions"],
          [declaration.salaryRaisesAndPromotions, "augmentations et promotions"],
          [declaration.maternityLeaves, "congés maternité"],
        ] as Array<[IndicatorRule16, string]>;

        // Règle 17 - Cas d'absences des objectifs de progression
        if (
          declaration.year.getValue() < 2021 ||
          !declaration.index ||
          declaration.index.getValue() >= OBJECTIVES_THRESHOLD
        ) {
          for (const [indicator, name] of indicators16) {
            assert(
              indicator?.progressObjective === undefined,
              `L'objectif de progression pour l'indicateur ${name} doit être absent.`,
            );
          }
          assert(
            declaration.publication.measuresPublishDate === undefined,
            "La date de publication des mesures doit être absente.",
          );
          assert(
            declaration.publication.objectivesPublishDate === undefined,
            "La date de publication des objectifs doit être absente.",
          );
          assert(
            declaration.publication.modalities === undefined,
            "Les modalités des objectifs mesures doivent être absentes.",
          );
        }

        // Règle 18 - Date de publication des objectifs de progression
        if (declaration.year.getValue() >= 2021 && declaration.index && declaration.index.getValue() <= 85) {
          assert(
            declaration.publication.objectivesPublishDate !== undefined,
            "La date de publication des objectifs de progression doit être renseignée.",
          );
          assert(
            isAfter(declaration.publication.objectivesPublishDate, declaration.endReferencePeriod),
            "La date de publication des objectifs de progression doit être postérieure à la fin de période de référence.",
          );
        }

        // Règle 19 - Date de publication des mesures
        if (declaration.year.getValue() >= 2021 && declaration.index && declaration.index.getValue() < 75) {
          assert(
            declaration.publication.measuresPublishDate !== undefined,
            "La date de publication des mesures doit être renseignée.",
          );
          assert(
            isAfter(declaration.publication.measuresPublishDate, declaration.endReferencePeriod),
            "La date de publication des mesures doit être postérieure à la fin de période de référence.",
          );
        }

        // Règle 20 - Présence des modalités des objectifs et mesures
        if (
          declaration.year.getValue() >= 2021 &&
          declaration.index &&
          declaration.index.getValue() < 75 &&
          !declaration.publication.url
        ) {
          assert(
            declaration.publication.modalities !== undefined,
            "Les modalités des objectifs mesures doivent être renseignées.",
          );
        }

        // Règle 20 bis - Absence des modalités des objectifs et mesures pour les entreprises publiant sur internet dont l'année est supérieure ou égal à 2021
        if (
          declaration.year.getValue() >= 2021 &&
          declaration.index &&
          declaration.index.getValue() >= 75 &&
          declaration.index.getValue() <= 85 &&
          declaration.publication.url
        ) {
          assert(
            declaration.publication.modalities === undefined,
            "Les modalités des objectifs mesures doivent être absentes.",
          );
        }

        type IndicatorRule20 =
          | { notComputableReason?: string; progressObjective?: string; result?: Percentage }
          | undefined;

        const indicators20 = [
          [declaration.remunerations, "rémunérations", indicatorNoteMax.remunerations],
          [declaration.salaryRaises, "augmentations", indicatorNoteMax.augmentations],
          [declaration.promotions, "promotions", indicatorNoteMax.promotions],
          [declaration.salaryRaisesAndPromotions, indicatorNoteMax["augmentations-et-promotions"]],
          [declaration.maternityLeaves, "congés maternité", indicatorNoteMax["conges-maternite"]],
        ] as Array<[IndicatorRule20, string, number]>;

        // Règle 21 - Absence d'un objectif pour un indicateur
        if (declaration.year.getValue() >= 2021) {
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
        if (declaration.year.getValue() >= 2021) {
          for (const [indicator, name, max] of indicators20) {
            if (
              !indicator?.notComputableReason &&
              indicator?.result?.getValue() &&
              indicator?.result?.getValue() < max
            ) {
              assert(
                indicator.progressObjective !== undefined,
                `L'objectif de progression pour l'indicateur ${name} doit être renseigné.`,
              );
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        this._lastError = new DeclarationSpecificationError(error.message);
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

export class DeclarationSpecificationError extends ValidationError {}
export class DeclarationMissingFieldError extends DeclarationSpecificationError {}
export class DeclarationExtraFieldError extends DeclarationSpecificationError {}
