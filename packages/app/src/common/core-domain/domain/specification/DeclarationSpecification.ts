import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { AbstractSpecification, ValidationError } from "@common/shared-domain";
import { type Percentage } from "@common/shared-domain/domain/valueObjects";
import assert from "assert";
import { isAfter } from "date-fns";

import { type Declaration } from "../Declaration";
import { CompanyWorkforceRange } from "../valueObjects/declaration/CompanyWorkforceRange";
import { type NotComputableReason } from "../valueObjects/declaration/indicators/NotComputableReason";
import { RemunerationsMode } from "../valueObjects/declaration/indicators/RemunerationsMode";

const OBJECTIVES_THRESHOLD = 85;
const MEASURES_THRESHOLD = 75;

/*
Feature: Règles pour la déclaration (TODO: à confirmer par le métier)
    Scenario: Règle 1 - Assertion année indicateurs
        Étant donné une déclaration
        Quand l'année des indicateurs est inférieure à 2020 ou supérieure à l'année en cours
        Alors la déclaration ne peut pas être soumise

    Scenario: Règle 2 - Assertion champs obligatoires
        Étant donné une déclaration
        Quand la déclaration ne comporte pas les informations suivantes : siren, année au titre de laquelle les indicateurs sont calculés, infos déclarant, infos entreprise/UES et période suffisante
        Alors la déclaration ne peut pas être soumise

    Scenario: Règle 3 - Assertion période non suffisante et indicateurs absents
        Étant donné une déclaration
        Quand la période n'est pas suffisante
        Alors les indicateurs doivent être absents

    Scenario: Règle 3 bis - Assertion période suffisante & indicateurs présents
        Étant donné une déclaration
        Quand la période est suffisante
        Alors les indicateurs doivent être renseignés

    Scenario: Règle 4 - Assertion date de publication
        Étant donné une déclaration
        Quand l'index est calculable
        Alors la date de publication doit être renseignée

    Scenario: Règle 5 - Assertion modalités ou url de publication
        Étant donné une déclaration
        Quand l'index est calculable
        Alors soit les modalités de publication, soit l'url de publication doivent être renseignés mais pas les 2

    Scenario: Règle 6 - Assertion sur l'année de la fin de période de référence
        Étant donné une déclaration
        Quand l'année de la fin de période de référence n'est pas l'année des indicateurs
        Alors la déclaration ne peut pas être soumise

    Scenario: Règle 7 - Tranche 50-250 et indicateurs
        Étant donné une déclaration
        Quand la tranche est 50-250
        Alors l'indicateur "augmentations et promotions" doit être renseigné ET l'indicateur augmentations et l'indicateur promotions doivent être absents

    Scenario: Règle 7 bis - Tranche !== 50-250 et indicateurs
        Étant donné une déclaration
        Quand la tranche n'est pas 50:250
        Alors l'indicateur "augmentations et promotions" doit être absent ET l'indicateur augmentations et l'indicateur promotions doivent être renseignés

    Scenario: Règle 8 - Si un indicateur est non calculable, aucune autre information n'est présente
        Étant donné une déclaration
        Quand un indicateur est non calculable 
        Alors aucune autre information ne doit exister pour cet indicateur

    Scenario: Règle 8 bis - Si un indicateur est calculable, le résultat doit être renseigné
        Étant donné une déclaration
        Quand un indicateur est calculable 
        Alors cet indicateur doit avoir un résultat
        
    Scenario: Règle 9 - Population favorable pour les indicateurs rémunérations, augmentations, promotions
        Étant donné un indicateur parmi rémunérations, augmentations, promotions
        Quand le résultat est 0 
        Alors la population favorable doit être absente

    Scenario: Règle 10 - Population favorable pour l'indicateur augmentations et promotions
        Étant donné l'indicateur augmentation et promotions
        Quand le résultat est 0 et que le résultat en nombre de salariés est aussi 0
        Alors la population favorable doit être absente

    Scenario: Règle 11 - Population favorable pour l'indicateur hautes rémunérations
        Étant donné l'indicateur hautes rémunérations
        Quand le résultat est 5
        Alors la population favorable doit être absente

    Scenario: Règle 12 - Une UES doit contenir au moins une entreprise
        Étant donné une déclaration d'une UES
        Quand il n'y a pas d'entreprise à l'intérieur de l'UES
        Alors la déclaration ne peut être soumise

    Scenario: Règle 13 - Les Siren d'une UES ne doivent pas être dupliqués
        Étant donné une déclaration d'une UES
        Quand 2 Siren ou plus composant l'UES sont les mêmes
        Alors la déclaration ne peut être soumise

    Scenario: Règle 13 bis - Le Siren de l'entreprise déclarante ne doit pas se retrouver dans l'UES
        Étant donné une déclaration d'une UES
        Quand le Siren de l'entreprise déclarante est présente dans les Siren de l'UES
        Alors la déclaration ne peut être soumise

    Scenario: Règle 14 - Date de consultation CSE absente
        Étant donné une déclaration avec l'indicateur de rémunérations calculable
        Quand le mode de calcul est CSP
        Alors la date de consultation du CSE doit être absent

    Scenario: Règle 14 bis - Date de consultation CSE obligatoire pour les modes !== CSP + structure de type UES
        Étant donné une déclaration avec l'indicateur de rémunérations calculable
        Quand le mode de calcul n'est pas CSP ET que la structure est une UES
        Alors la date de consultation du CSE doit être renseignée ET être postérieure à l'existence d'Egapro (01/01/2018)

    Scenario: Règle 15 - Les mesures correctives sont absentes pour un index non calculable ou >= 75
        Étant donné une déclaration
        Quand l'index est non calculable ou qu'il est >= 75
        Alors les mesures correctives doivent être absentes

    Scenario: Règle 15 bis - Les mesures correctives sont présentes pour un index < 75
        Étant donné une déclaration
        Quand l'index est < 75
        Alors les mesures correctives doivent être renseignées

    Scenario: Règle 16 - Cas d'absences des objectifs de progression
        Étant donné une déclaration
        Quand l'année est strictement inférieure à 2021 ou bien que l'index est non calculable ou bien index >= 85
        Alors les objectifs de progression des indicateurs doivent être absents, ainsi que la date de publication des mesures, la date de publication des objectifs et les modalités des objectifs mesures

    Scenario: Règle 17 - Date de publication des objectifs de progression
        Étant donné une déclaration dont l'année est supérieure ou égal à 2021
        Quand l'index <= 85
        Alors la date de publication des objectifs de progression doit être renseignée et être strictement postérieure à la fin de période de référence

    Scenario: Règle 18 - Date de publication des mesures
        Étant donné une déclaration dont l'année est supérieure ou égal à 2021
        Quand l'index est < à 75
        Alors la date de publication des mesures doit être renseignée et être strictement postérieure à la fin de période de référence

    Scenario: Règle 19 - Présence des modalités des objectifs et mesures
        Étant donné une déclaration dont l'année est supérieure ou égal à 2021 et l'index est <= 85
        Quand la déclaration n'est pas publiée sur un site web ou que l'index < 75
        Alors les modalités des objectifs mesures doivent être renseignés

    Scenario: Règle 19 bis - Absence des modalités des objectifs et mesures pour les entreprises publiant sur internet dont l'année est supérieure ou égal à 2021
        Étant donné une déclaration dont l'année est supérieure ou égal à 2021 et l'index est <= 85
        Quand la déclaration est publiée sur un site web et que l'index >= 75
        Alors les modalités des objectifs mesures doivent être absentes

    Scenario: Règle 20 - Absence d'un objectif pour un indicateur
        Étant donné une déclaration dont l'année est supérieure ou égal à 2021
        Quand un indicateur est non calculable ou égal au maximum possible pour cet indicateur
        Alors l'objectif de progression pour cet indicateur doit être absent

    Scenario: Règle 20 bis - Présence d'un objectif pour un indicateur
        Étant donné une déclaration dont l'année est supérieure ou égal à 2021
        Quand un indicateur est calculable et inférieur au maximum possible pour cet indicateur
        Alors l'objectif de progression pour cet indicateur doit être renseigné
*/

/**
 * Specification for Declaration.
 * See : https://github.com/SocialGouv/egapro/issues/1767
 */
export class DeclarationSpecification extends AbstractSpecification<Declaration> {
  private _lastError?: ValidationError;

  public isSatisfiedBy(declaration: Declaration): boolean {
    // TODO: confirm year with product owner
    assert(
      declaration.year.getValue() >= 2020 && declaration.year.getValue() <= new Date().getFullYear(),
      "Règle 1 - Assertion année indicateurs",
    );

    // Règle 2 - Assertion champs obligatoiresx
    this.assertMandatoryFields(declaration);

    // Règle 3 & 3 bis - Relation période non suffisante et indicateurs
    this.assertIndicatorsWithSufficientPeriod(declaration);

    if (declaration.index) {
      // Règle 4 - Assertion date de publication
      assert(declaration.publication?.date, "la date de publication doit être renseignée quand l'index est calculable");

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

      if (declaration.company.range!.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
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

      const indicators = [
        [declaration.remunerations, "rémunérations"],
        [declaration.salaryRaises, "augmentations"],
        [declaration.promotions, "promotions"],
        [declaration.salaryRaisesAndPromotions, "augmentations et promotions"],
        [declaration.maternityLeaves, "congés maternité"],
      ] as Array<[Indicator, string]>;

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
          declaration.remunerations?.cseConsultationDate!.getFullYear() >= 2018,
          "La date de consultation du CSE doit être postérieure à l'existence d'Egapro (01/01/2018).",
        );
      }

      // Règle 15 - Les mesures correctives sont absentes pour un index non calculable ou >= 75
      if (!declaration.index || declaration.index.getValue() >= MEASURES_THRESHOLD) {
        assert(
          declaration.correctiveMeasures === undefined,
          "Les mesures correctives doivent être absentes pour un index non calculable ou >= 75.",
        );
      }

      // Règle 15 bis - Les mesures correctives sont présentes pour un index < 75
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

      // Règle 16 - Cas d'absences des objectifs de progression
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

      // Règle 17 - Date de publication des objectifs de progression
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

      // Règle 18 - Date de publication des mesures
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

      // Règle 19 - Présence des modalités des objectifs et mesures
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

      // Règle 19 bis - Absence des modalités des objectifs et mesures pour les entreprises publiant sur internet dont l'année est supérieure ou égal à 2021
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

      // Règle 20 - Absence d'un objectif pour un indicateur
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

      // Règle 21 - Présence d'un objectif pour un indicateur
      if (declaration.year.getValue() >= 2021) {
        for (const [indicator, name, max] of indicators20) {
          if (!indicator?.notComputableReason && indicator?.result?.getValue() && indicator?.result?.getValue() < max) {
            assert(
              indicator.progressObjective !== undefined,
              `L'objectif de progression pour l'indicateur ${name} doit être renseigné.`,
            );
          }
        }
      }
    }

    // try {
    //   if (data.declaration.draft) {
    //     this.assertRequiredFields(data);
    //   }

    //   if (!data.declaration.sufficientPeriod) {
    //     if (data.indicators)
    //       throw new DeclarationSpecificationError("La période de référence ne permet pas de définir des indicateurs.");
    //   } else {
    //     this.assertIndicators(data);
    //   }
    // } catch (error: unknown) {
    //   if (error instanceof ValidationError) {
    //     this._lastError = error;
    //     return false;
    //   } else {
    //     throw error;
    //   }
    // }

    return true;
  }

  /** Rule 2 */
  private assertMandatoryFields(declaration: Declaration) {
    // siren, year are present by definition but we check them anyway.
    if (!declaration.siren || !declaration.year) {
      throw new DeclarationMissingFieldError("Les informations Sirent et année sont obligatoires.");
    }
    if (
      !declaration.declarant.phone ||
      !declaration.declarant.firstname ||
      !!declaration.declarant.lastname ||
      !!declaration.declarant.email
    ) {
      throw new DeclarationMissingFieldError("Les informations sur le déclarant sont obligatoires.");
    }
    if (!declaration.company.siren || !declaration.company.range) {
      throw new DeclarationMissingFieldError("Le Siren de l'entreprise déclarante est obligatoire.");
    }
    if (typeof declaration.sufficientPeriod === "undefined") {
      throw new DeclarationMissingFieldError("Le champ période suiffante est obligatoire.");
    }
  }

  /** Rule 3 and 3 bis */
  private assertIndicatorsWithSufficientPeriod(declaration: Declaration) {
    if (!declaration.sufficientPeriod) {
      if (
        !!declaration.salaryRaises ||
        !!declaration.salaryRaisesAndPromotions ||
        !!declaration.promotions ||
        !!declaration.remunerations ||
        !!declaration.maternityLeaves ||
        !!declaration.highRemunerations
      ) {
        throw new DeclarationSpecificationError(
          "Les indicateurs ne doivent pas être renseignés quand la période n'est pas suffisante.",
        );
      }
    } else {
      if (declaration.company.range?.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
        if (!declaration.salaryRaisesAndPromotions) {
          throw new DeclarationMissingFieldError(
            "L'indicateur des augmentations et promotions doit être renseigné pour les entreprises de 50 à 250 salariés.",
          );
        }
      } else {
        if (!declaration.salaryRaises || !declaration.promotions) {
          throw new DeclarationMissingFieldError(
            "Les indicateurs des augmentations et celui des promotions doivent être renseignés pour les entreprises de plus de 250 salariés.",
          );
        }
      }

      if (!declaration.remunerations) {
        throw new DeclarationMissingFieldError("L'indicateur des rémunérations doit être renseigné.");
      }
      if (!declaration.maternityLeaves) {
        throw new DeclarationMissingFieldError("L'indicateur des congés maternité doit être renseigné.");
      }
      if (!declaration.highRemunerations) {
        throw new DeclarationMissingFieldError("L'indicateur des hautes rémunérations doit être renseigné.");
      }
    }
  }

  get lastError() {
    return this._lastError;
  }
}

export class DeclarationSpecificationError extends ValidationError {}
export class DeclarationMissingFieldError extends DeclarationSpecificationError {}
export class DeclarationExtraFieldError extends DeclarationSpecificationError {}
