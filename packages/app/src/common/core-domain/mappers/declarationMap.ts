import type { DeclarationRaw } from "@api/core-domain/infra/db/raw";
import type {
  AnneeIndicateur,
  CategoriesSimples,
  CodeNaf,
  CodePays,
  Departement,
  Effectif,
  Entreprise as Entreprises,
  Region,
  Remunerations,
} from "@common/models/generated";
import type { Mapper } from "@common/shared-domain";
import { Email, PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import type { Any } from "@common/utils/types";

import { Declaration } from "../domain/Declaration";
import { DeclarationData } from "../domain/DeclarationData";
import { Siren } from "../domain/valueObjects/Siren";
import type { DeclarationDTO } from "../dtos/DeclarationDTO";

export const declarationMap: Required<Mapper<Declaration, DeclarationDTO | null, DeclarationRaw>> = {
  // TODO convert without validation if perf are not good
  toDomain(raw) {
    return new Declaration({
      declarant: new Email(raw.declarant),
      declaredAt: new Date(raw.declared_at),
      modifiedAt: new Date(raw.modified_at),
      siren: new Siren(raw.siren),
      year: new PositiveNumber(raw.year),
      data: raw.data
        ? DeclarationData.fromJson({
            company: {
              address: raw.data.entreprise.adresse,
              city: raw.data.entreprise.commune,
              countryCode: raw.data.entreprise.code_pays,
              county: raw.data.entreprise.département,
              hasRecoveryPlan: !!raw.data.entreprise.plan_relance,
              name: raw.data.entreprise.raison_sociale,
              postalCode: raw.data.entreprise.code_postal,
              region: raw.data.entreprise.région,
              siren: raw.data.entreprise.siren,
              ues: raw.data.entreprise.ues
                ? {
                    companies:
                      raw.data.entreprise.ues.entreprises?.map(entreprise => ({
                        name: entreprise.raison_sociale,
                        siren: entreprise.siren,
                      })) ?? [],
                    name: raw.data.entreprise.ues.nom,
                  }
                : void 0,
              workforce: {
                range: raw.data.entreprise.effectif?.tranche,
                total: raw.data.entreprise.effectif?.total,
              },
              nafCode: raw.data.entreprise.code_naf,
            },
            declarant: {
              email: raw.data.déclarant.email,
              firstname: raw.data.déclarant.prénom,
              lastname: raw.data.déclarant.nom,
              phone: raw.data.déclarant.téléphone,
            },
            source: raw.data.source,
            declaration: {
              computablePoints: raw.data.déclaration.points_calculables,
              correctiveMeasures: raw.data.déclaration.mesures_correctives,
              date: raw.data.déclaration.date,
              draft: !!raw.data.déclaration.brouillon,
              endReferencePeriod: raw.data.déclaration.fin_période_référence,
              indicatorsYear: raw.data.déclaration.année_indicateurs,
              points: raw.data.déclaration.points,
              publication: raw.data.déclaration.publication
                ? {
                    date: raw.data.déclaration.publication.date,
                    modalities: raw.data.déclaration.publication.modalités,
                    url: raw.data.déclaration.publication.url,
                    measuresPublishDate: raw.data.déclaration.publication.date_publication_mesures,
                    objectivesMeasuresModalities: raw.data.déclaration.publication.modalités_objectifs_mesures,
                    objectivesPublishDate: raw.data.déclaration.publication.date_publication_objectifs,
                  }
                : void 0,
              sufficientPeriod: !!raw.data.déclaration.période_suffisante,
              index: raw.data.déclaration.index,
            },
            indicators: {
              highRemunerations: raw.data.indicateurs?.hautes_rémunérations
                ? {
                    favorablePopulation: raw.data.indicateurs?.hautes_rémunérations.population_favorable,
                    result: raw.data.indicateurs?.hautes_rémunérations.résultat,
                    score: raw.data.indicateurs?.hautes_rémunérations.note,
                    progressObjective: raw.data.indicateurs?.hautes_rémunérations.objectif_de_progression,
                  }
                : void 0,
              maternityLeaves: raw.data.indicateurs?.congés_maternité
                ? {
                    result: raw.data.indicateurs?.congés_maternité.résultat,
                    score: raw.data.indicateurs?.congés_maternité.note,
                    progressObjective: raw.data.indicateurs?.congés_maternité.objectif_de_progression,
                    notComputableReason: raw.data.indicateurs?.congés_maternité.non_calculable,
                  }
                : void 0,
              promotions: raw.data.indicateurs?.promotions
                ? {
                    result: raw.data.indicateurs?.promotions.résultat,
                    score: raw.data.indicateurs?.promotions.note,
                    progressObjective: raw.data.indicateurs?.promotions.objectif_de_progression,
                    notComputableReason: raw.data.indicateurs?.promotions.non_calculable,
                    categories: raw.data.indicateurs?.promotions.catégories ?? [null, null, null, null],
                    favorablePopulation: raw.data.indicateurs?.promotions.population_favorable,
                  }
                : void 0,
              remunerations: raw.data.indicateurs?.rémunérations
                ? {
                    result: raw.data.indicateurs?.rémunérations.résultat,
                    score: raw.data.indicateurs?.rémunérations.note,
                    progressObjective: raw.data.indicateurs?.rémunérations.objectif_de_progression,
                    notComputableReason: raw.data.indicateurs?.rémunérations.non_calculable,
                    categories:
                      raw.data.indicateurs?.rémunérations.catégories?.map(cat => ({
                        name: cat.nom,
                        ranges: cat.tranches,
                      })) ?? [],
                    favorablePopulation: raw.data.indicateurs?.rémunérations.population_favorable,
                    cseConsultationDate: raw.data.indicateurs?.rémunérations.date_consultation_cse,
                    mode: raw.data.indicateurs?.rémunérations.mode,
                  }
                : void 0,
              salaryRaises: raw.data.indicateurs?.augmentations
                ? {
                    result: raw.data.indicateurs?.augmentations.résultat,
                    score: raw.data.indicateurs?.augmentations.note,
                    progressObjective: raw.data.indicateurs?.augmentations.objectif_de_progression,
                    notComputableReason: raw.data.indicateurs?.augmentations.non_calculable,
                    categories: raw.data.indicateurs?.augmentations.catégories ?? [null, null, null, null],
                    favorablePopulation: raw.data.indicateurs?.augmentations.population_favorable,
                  }
                : void 0,
              salaryRaisesAndPromotions: raw.data.indicateurs?.augmentations_et_promotions
                ? {
                    result: raw.data.indicateurs?.augmentations_et_promotions.résultat,
                    score: raw.data.indicateurs?.augmentations_et_promotions.note,
                    progressObjective: raw.data.indicateurs?.augmentations_et_promotions.objectif_de_progression,
                    notComputableReason: raw.data.indicateurs?.augmentations_et_promotions.non_calculable,
                    favorablePopulation: raw.data.indicateurs?.augmentations_et_promotions.population_favorable,
                    employeesCountResult: raw.data.indicateurs?.augmentations_et_promotions.résultat_nombre_salariés,
                    employeesCountScore: raw.data.indicateurs?.augmentations_et_promotions.note_nombre_salariés,
                    percentScore: raw.data.indicateurs?.augmentations_et_promotions.note_en_pourcentage,
                  }
                : void 0,
            },
          })
        : void 0,
    });
  },

  toDTO(obj) {
    const data = obj.data ?? obj.draft;
    if (data) {
      return declarationDataToDTO(data);
    }

    return null;
  },

  toPersistence(obj) {
    // TODO
    return {
      declarant: obj.declarant.getValue(),
      declared_at: obj.declaredAt.toISOString(),
      ft: "", // TODO
      modified_at: obj.modifiedAt.toISOString(),
      siren: obj.siren.getValue(),
      year: obj.year.getValue(),
      data: obj.data ? declarationDataToDTO(obj.data) : void 0,
      draft: obj.draft && !obj.data ? declarationDataToDTO(obj.draft) : void 0,
      legacy: void 0, // TODO
    };
  },
};

function declarationDataToDTO(data: DeclarationData): DeclarationDTO {
  type Categories = NonNullable<Remunerations["catégories"]>[number];
  type Entreprise = Entreprises[number];
  type Tranche = NonNullable<Effectif["tranche"]>;

  const defaultCategories: CategoriesSimples = [null, null, null, null];
  return {
    déclarant: {
      email: data.declarant.email.getValue(),
      nom: data.declarant.lastname,
      prénom: data.declarant.firstname,
      téléphone: data.declarant.phone,
    },
    déclaration: {
      année_indicateurs: data.declaration.indicatorsYear.getValue() as AnneeIndicateur,
      brouillon: data.declaration.draft,
      date: data.declaration.date?.toISOString(),
      fin_période_référence: data.declaration.endReferencePeriod?.toISOString(),
      index: data.declaration.index?.getValue(),
      mesures_correctives: data.declaration.correctiveMeasures?.getValue(),
      points: data.declaration.points?.getValue(),
      points_calculables: data.declaration.computablePoints?.getValue(),
      publication: {
        date: data.declaration.publication?.date?.toISOString(),
        date_publication_mesures: data.declaration.publication?.measuresPublishDate?.toISOString(),
        date_publication_objectifs: data.declaration.publication?.objectivesPublishDate?.toISOString(),
        modalités: data.declaration.publication?.modalities,
        modalités_objectifs_mesures: data.declaration.publication?.objectivesMeasuresModalities,
        url: data.declaration.publication?.url,
      },
      période_suffisante: data.declaration.sufficientPeriod,
    },
    entreprise: {
      siren: data.company.siren.getValue(),
      adresse: data.company.address,
      code_naf: data.company.nafCode?.getValue() as CodeNaf,
      code_pays: data.company.countryCode?.getValue() as CodePays,
      code_postal: data.company.postalCode?.getValue(),
      commune: data.company.city,
      département: data.company.county?.getValue() as Departement,
      effectif: {
        total: data.company.workforce?.total?.getValue(),
        tranche: data.company.workforce?.range?.getValue() as Tranche,
      },
      plan_relance: data.company.hasRecoveryPlan,
      raison_sociale: data.company.name,
      région: data.company.region?.getValue() as Region,
      ues: {
        entreprises: data.company.ues?.companies.map<Entreprise>(company => ({
          raison_sociale: company.name,
          siren: company.siren.getValue(),
        })),
        nom: data.company.ues?.name,
      },
    },
    source: data.source?.getValue(),
    id: data.id,
    indicateurs: {
      augmentations: {
        catégories: data.indicators?.salaryRaises?.categories.map(cat => cat?.getValue() ?? null) ?? defaultCategories,
        non_calculable: data.indicators?.salaryRaises?.notComputableReason?.getValue() as Any,
        note: data.indicators?.salaryRaises?.score?.getValue(),
        objectif_de_progression: data.indicators?.salaryRaises?.progressObjective,
        population_favorable: data.indicators?.salaryRaises?.favorablePopulation?.getValue(),
        résultat: data.indicators?.salaryRaises?.result?.getValue(),
      },
      augmentations_et_promotions: {
        note: data.indicators?.salaryRaisesAndPromotions?.score?.getValue(),
        non_calculable: data.indicators?.salaryRaisesAndPromotions?.notComputableReason?.getValue() as Any,
        résultat: data.indicators?.salaryRaisesAndPromotions?.result?.getValue(),
        note_en_pourcentage: data.indicators?.salaryRaisesAndPromotions?.percentScore?.getValue(),
        note_nombre_salariés: data.indicators?.salaryRaisesAndPromotions?.employeesCountScore?.getValue(),
        objectif_de_progression: data.indicators?.salaryRaisesAndPromotions?.progressObjective,
        population_favorable: data.indicators?.salaryRaisesAndPromotions?.favorablePopulation?.getValue(),
        résultat_nombre_salariés: data.indicators?.salaryRaisesAndPromotions?.employeesCountResult?.getValue(),
      },
      congés_maternité: {
        note: data.indicators?.maternityLeaves?.score?.getValue(),
        résultat: data.indicators?.maternityLeaves?.result?.getValue(),
        non_calculable: data.indicators?.maternityLeaves?.notComputableReason?.getValue() as Any,
        objectif_de_progression: data.indicators?.salaryRaisesAndPromotions?.progressObjective,
      },
      hautes_rémunérations: {
        note: data.indicators?.highRemunerations?.score?.getValue(),
        résultat: data.indicators?.highRemunerations?.result?.getValue(),
        objectif_de_progression: data.indicators?.highRemunerations?.progressObjective,
        population_favorable: data.indicators?.highRemunerations?.favorablePopulation?.getValue(),
      },
      promotions: {
        note: data.indicators?.promotions?.score?.getValue(),
        non_calculable: data.indicators?.promotions?.notComputableReason?.getValue() as Any,
        résultat: data.indicators?.promotions?.result?.getValue(),
        objectif_de_progression: data.indicators?.promotions?.progressObjective,
        population_favorable: data.indicators?.promotions?.favorablePopulation?.getValue(),
        catégories: data.indicators?.promotions?.categories.map(cat => cat?.getValue() ?? null) ?? defaultCategories,
      },
      rémunérations: {
        note: data.indicators?.remunerations?.score?.getValue(),
        non_calculable: data.indicators?.remunerations?.notComputableReason?.getValue() as Any,
        résultat: data.indicators?.remunerations?.result?.getValue(),
        objectif_de_progression: data.indicators?.remunerations?.progressObjective,
        population_favorable: data.indicators?.remunerations?.favorablePopulation?.getValue(),
        catégories: data.indicators?.remunerations?.categories.map<Categories>(cat => ({
          nom: cat.name,
          tranches: {
            "30:39": cat.ranges?.["30:39"]?.getValue(),
            "40:49": cat.ranges?.["40:49"]?.getValue(),
            "50:": cat.ranges?.["50:"]?.getValue(),
            ":29": cat.ranges?.[":29"]?.getValue(),
          },
        })),
        date_consultation_cse: data.indicators?.remunerations?.cseConsultationDate?.toISOString(),
        mode: data.indicators?.remunerations?.mode?.getValue(),
      },
    },
  };
}
