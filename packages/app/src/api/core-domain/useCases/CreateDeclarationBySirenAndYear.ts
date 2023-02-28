import { Declaration } from "@common/core-domain/domain/Declaration";
import { DeclarationData } from "@common/core-domain/domain/DeclarationData";
import { computeScores } from "@common/core-domain/domain/helpers/ScoreComputer";
import {
  DeclarationSpecification,
  DeclarationSpecificationError,
} from "@common/core-domain/domain/specification/DeclarationSpecification";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { YEARS } from "@common/dict";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { Email, PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import type { IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  data: DeclarationDTO;
  siren: string;
  year: string;
}

export class CreateDeclarationBySirenAndYear implements UseCase<Input, void> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public async execute({ siren, year, data }: Input): Promise<void> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(+year);

      if (!YEARS.includes(validatedYear.getValue())) {
        throw new CreateDeclarationBySirenAndYearInvalidYearError(
          `Il n'est possible de déclarer que pour les années ${YEARS.join(", ")}`,
        );
      }

      const now = new Date();
      const declarationData = DeclarationData.fromJson({
        company: {
          address: data.entreprise.adresse,
          city: data.entreprise.commune,
          countryCode: data.entreprise.code_pays,
          county: data.entreprise.département,
          hasRecoveryPlan: data.entreprise.plan_relance,
          name: data.entreprise.raison_sociale,
          postalCode: data.entreprise.code_postal,
          region: data.entreprise.région,
          siren: data.entreprise.siren,
          ues: data.entreprise.ues
            ? {
                companies:
                  data.entreprise.ues.entreprises?.map(entreprise => ({
                    name: entreprise.raison_sociale,
                    siren: entreprise.siren,
                  })) ?? [],
                name: data.entreprise.ues.nom,
              }
            : void 0,
          workforce: {
            range: data.entreprise.effectif?.tranche,
            total: data.entreprise.effectif?.total,
          },
          nafCode: data.entreprise.code_naf,
        },
        declarant: {
          email: data.déclarant.email,
          firstname: data.déclarant.prénom,
          lastname: data.déclarant.nom,
          phone: data.déclarant.téléphone,
        },
        source: data.source,
        declaration: {
          computablePoints: data.déclaration.points_calculables,
          correctiveMeasures: data.déclaration.mesures_correctives,
          date: data.déclaration.date,
          draft: !!data.déclaration.brouillon,
          endReferencePeriod: data.déclaration.fin_période_référence,
          indicatorsYear: data.déclaration.année_indicateurs,
          points: data.déclaration.points,
          publication: data.déclaration.publication
            ? {
                date: data.déclaration.publication.date,
                modalities: data.déclaration.publication.modalités,
                url: data.déclaration.publication.url,
                measuresPublishDate: data.déclaration.publication.date_publication_mesures,
                objectivesMeasuresModalities: data.déclaration.publication.modalités_objectifs_mesures,
                objectivesPublishDate: data.déclaration.publication.date_publication_objectifs,
              }
            : void 0,
          sufficientPeriod: !!data.déclaration.période_suffisante,
          index: data.déclaration.index,
        },
        indicators: {
          highRemunerations: data.indicateurs?.hautes_rémunérations
            ? {
                favorablePopulation: data.indicateurs?.hautes_rémunérations.population_favorable,
                result: data.indicateurs?.hautes_rémunérations.résultat,
                score: data.indicateurs?.hautes_rémunérations.note,
                progressObjective: data.indicateurs?.hautes_rémunérations.objectif_de_progression,
              }
            : void 0,
          maternityLeaves: data.indicateurs?.congés_maternité
            ? {
                result: data.indicateurs?.congés_maternité.résultat,
                score: data.indicateurs?.congés_maternité.note,
                progressObjective: data.indicateurs?.congés_maternité.objectif_de_progression,
                notComputableReason: data.indicateurs?.congés_maternité.non_calculable,
              }
            : void 0,
          promotions: data.indicateurs?.promotions
            ? {
                result: data.indicateurs?.promotions.résultat,
                score: data.indicateurs?.promotions.note,
                progressObjective: data.indicateurs?.promotions.objectif_de_progression,
                notComputableReason: data.indicateurs?.promotions.non_calculable,
                categories: data.indicateurs?.promotions.catégories ?? [null, null, null, null],
                favorablePopulation: data.indicateurs?.promotions.population_favorable,
              }
            : void 0,
          remunerations: data.indicateurs?.rémunérations
            ? {
                result: data.indicateurs?.rémunérations.résultat,
                score: data.indicateurs?.rémunérations.note,
                progressObjective: data.indicateurs?.rémunérations.objectif_de_progression,
                notComputableReason: data.indicateurs?.rémunérations.non_calculable,
                categories:
                  data.indicateurs?.rémunérations.catégories?.map(cat => ({
                    name: cat.nom,
                    ranges: cat.tranches,
                  })) ?? [],
                favorablePopulation: data.indicateurs?.rémunérations.population_favorable,
                cseConsultationDate: data.indicateurs?.rémunérations.date_consultation_cse,
                mode: data.indicateurs?.rémunérations.mode,
              }
            : void 0,
          salaryRaises: data.indicateurs?.augmentations
            ? {
                result: data.indicateurs?.augmentations.résultat,
                score: data.indicateurs?.augmentations.note,
                progressObjective: data.indicateurs?.augmentations.objectif_de_progression,
                notComputableReason: data.indicateurs?.augmentations.non_calculable,
                categories: data.indicateurs?.augmentations.catégories ?? [null, null, null, null],
                favorablePopulation: data.indicateurs?.augmentations.population_favorable,
              }
            : void 0,
          salaryRaisesAndPromotions: data.indicateurs?.augmentations_et_promotions
            ? {
                result: data.indicateurs?.augmentations_et_promotions.résultat,
                score: data.indicateurs?.augmentations_et_promotions.note,
                progressObjective: data.indicateurs?.augmentations_et_promotions.objectif_de_progression,
                notComputableReason: data.indicateurs?.augmentations_et_promotions.non_calculable,
                favorablePopulation: data.indicateurs?.augmentations_et_promotions.population_favorable,
                employeesCountResult: data.indicateurs?.augmentations_et_promotions.résultat_nombre_salariés,
                employeesCountScore: data.indicateurs?.augmentations_et_promotions.note_nombre_salariés,
                percentScore: data.indicateurs?.augmentations_et_promotions.note_en_pourcentage,
              }
            : void 0,
        },
      });

      computeScores(declarationData);

      const specification = new DeclarationSpecification();
      try {
        specification.isSatisfiedBy(declarationData);
      } catch (error: unknown) {
        if (error instanceof DeclarationSpecificationError) {
          throw new CreateDeclarationBySirenAndYearInvalidData("Invalid declaration", error);
        }

        throw error;
      }

      const declaration = new Declaration({
        declarant: new Email(data.déclarant.email),
        declaredAt: now,
        modifiedAt: now,
        siren: validatedSiren,
        year: validatedYear,
        [data.déclaration.brouillon ? "draft" : "data"]: declarationData,
      });

      await this.declarationRepo.save(declaration);
    } catch (error: unknown) {
      throw new CreateDeclarationBySirenAndYearError("Cannot create declaration", error as Error);
    }
  }
}

export class CreateDeclarationBySirenAndYearError extends AppError {}
export class CreateDeclarationBySirenAndYearInvalidYearError extends CreateDeclarationBySirenAndYearError {}
export class CreateDeclarationBySirenAndYearInvalidData extends CreateDeclarationBySirenAndYearError {}
