import { type CodeDepartement } from "@api/core-domain/infra/db/CodeDepartement";
import { type CodePays } from "@api/core-domain/infra/db/CodePays";
import { type CodeRegion } from "@api/core-domain/infra/db/CodeRegion";
import {
  type CategoriesSimples,
  type DeclarationDataRaw,
  type DeclarationRaw,
  type Effectif,
  type EntrepriseSummary,
  type PopulationFavorable,
  type Remunerations,
} from "@api/core-domain/infra/db/DeclarationRaw";
import { type AnneeIndicateur } from "@common/models/generated";
import { type Mapper } from "@common/shared-domain";
import { dateObjectToDateISOString, dateObjectToDateTimeISOString } from "@common/utils/date";
import { omitByRecursively } from "@common/utils/object";
import { type Any } from "@common/utils/types";
import { isUndefined } from "lodash";

import { Declaration } from "../domain/Declaration";
import { CSP } from "../domain/valueObjects/CSP";
import { AgeRange } from "../domain/valueObjects/declaration/AgeRange";
import { CorrectiveMeasures } from "../domain/valueObjects/declaration/declarationInfo/CorrectiveMeasures";
import { FavorablePopulation } from "../domain/valueObjects/declaration/indicators/FavorablePopulation";
import { RemunerationsMode } from "../domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type DeclarationDTO } from "../dtos/DeclarationDTO";

export const declarationMap: Required<Mapper<Declaration, DeclarationDTO, DeclarationRaw>> = {
  // TODO convert without validation if perf are not good
  toDomain(raw) {
    return Declaration.fromJson({
      siren: raw.siren,
      year: raw.year,
      declaredAt: new Date(raw.declared_at),
      modifiedAt: new Date(raw.modified_at),
      declarant: {
        email: raw.declarant,
        firstname: raw.data.déclarant.prénom,
        lastname: raw.data.déclarant.nom,
        phone: raw.data.déclarant.téléphone,
      },
      company: {
        address: raw.data.entreprise.adresse,
        city: raw.data.entreprise.commune,
        nafCode: raw.data.entreprise.code_naf,
        name: raw.data.entreprise.raison_sociale,
        siren: raw.data.entreprise.siren,
        countryCode: raw.data.entreprise.code_pays,
        county: raw.data.entreprise.département,
        postalCode: raw.data.entreprise.code_postal,
        region: raw.data.entreprise.région,
        hasRecoveryPlan: raw.data.entreprise.plan_relance,
        range: raw.data.entreprise.effectif?.tranche,
        total: raw.data.entreprise.effectif?.total,
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
      },

      index: raw.data.déclaration.index,
      points: raw.data.déclaration.points,
      computablePoints: raw.data.déclaration.points_calculables,
      endReferencePeriod: raw.data.déclaration.fin_période_référence,
      sufficientPeriod: raw.data.déclaration.période_suffisante ?? true,
      source: raw.data.source,

      highRemunerations: raw.data.indicateurs?.hautes_rémunérations
        ? {
            favorablePopulation:
              raw.data.indicateurs?.hautes_rémunérations.population_favorable === "" ||
              raw.data.indicateurs?.hautes_rémunérations.population_favorable === undefined
                ? "egalite"
                : raw.data.indicateurs?.hautes_rémunérations.population_favorable,
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
            notComputableReason: raw.data.indicateurs?.congés_maternité.non_calculable
              ? raw.data.indicateurs?.congés_maternité.non_calculable
              : undefined,
          }
        : void 0,
      promotions: raw.data.indicateurs?.promotions
        ? {
            result: raw.data.indicateurs?.promotions.résultat,
            score: raw.data.indicateurs?.promotions.note,
            progressObjective: raw.data.indicateurs?.promotions.objectif_de_progression,
            notComputableReason: raw.data.indicateurs?.promotions.non_calculable,
            categories: raw.data.indicateurs?.promotions.catégories ?? [null, null, null, null],
            favorablePopulation:
              raw.data.indicateurs?.promotions.population_favorable === ""
                ? "egalite"
                : raw.data.indicateurs?.promotions.population_favorable,
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
            favorablePopulation:
              raw.data.indicateurs?.rémunérations.population_favorable === ""
                ? "egalite"
                : raw.data.indicateurs?.rémunérations.population_favorable,
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
            favorablePopulation:
              raw.data.indicateurs?.augmentations.population_favorable === ""
                ? "egalite"
                : raw.data.indicateurs?.augmentations.population_favorable,
          }
        : void 0,
      salaryRaisesAndPromotions: raw.data.indicateurs?.augmentations_et_promotions
        ? {
            result: raw.data.indicateurs?.augmentations_et_promotions.résultat,
            score: raw.data.indicateurs?.augmentations_et_promotions.note,
            progressObjective: raw.data.indicateurs?.augmentations_et_promotions.objectif_de_progression,
            notComputableReason: raw.data.indicateurs?.augmentations_et_promotions.non_calculable,
            favorablePopulation:
              raw.data.indicateurs?.augmentations_et_promotions.population_favorable === ""
                ? "egalite"
                : raw.data.indicateurs?.augmentations_et_promotions.population_favorable,
            employeesCountResult: raw.data.indicateurs?.augmentations_et_promotions.résultat_nombre_salariés,
            employeesCountScore: raw.data.indicateurs?.augmentations_et_promotions.note_nombre_salariés,
            percentScore: raw.data.indicateurs?.augmentations_et_promotions.note_en_pourcentage,
          }
        : void 0,
    });
  },

  toDTO(obj) {
    const dto = {
      commencer: {
        annéeIndicateurs: obj.year.getValue(),
        siren: obj.siren.getValue(),
      },
      "declaration-existante": {
        status: "edition",
        date: dateObjectToDateISOString(obj.declaredAt),
      },
      declarant: {
        accordRgpd: true,
        email: obj.declarant.email.getValue(),
        nom: obj.declarant.lastname || "",
        prénom: obj.declarant.firstname || "",
        téléphone: obj.declarant.phone || "",
      },
      entreprise: {
        tranche: obj.company.range?.getValue(),
        type: obj.company.ues ? "ues" : "entreprise",
        entrepriseDéclarante: {
          siren: obj.siren.getValue(),
          adresse: obj.company.address || "",
          codeNaf: obj.company.nafCode.getValue(),
          raisonSociale: obj.company.name,
          codePays: obj.company.countryCode?.getValue(),
          codePostal: obj.company.postalCode?.getValue(),
          commune: obj.company.city,
          département: obj.company.county?.getValue(),
          région: obj.company.region?.getValue(),
        },
      },
    } as DeclarationDTO;

    if (obj.company.ues && obj.company.ues.companies.length > 0) {
      dto["ues"] = {
        entreprises: obj.company.ues.companies.map(company => ({
          raisonSociale: company.name,
          siren: company.siren.getValue(),
        })),
        nom: obj.company.ues?.name || "",
      };
    }

    if (!obj.sufficientPeriod) {
      dto["periode-reference"] = {
        périodeSuffisante: "non",
      };
    } else {
      dto["periode-reference"] = {
        périodeSuffisante: "oui",
        effectifTotal: obj.company.total?.getValue() ?? 0,
        finPériodeRéférence: obj.endReferencePeriod ? dateObjectToDateISOString(obj.endReferencePeriod) : "",
      };
    }

    const publication = obj.publication;
    if (publication) {
      dto["publication"] = {
        date: publication.date ? dateObjectToDateISOString(publication.date) : "",
        planRelance: obj.company.hasRecoveryPlan ? "oui" : "non",
        ...(publication.url
          ? { choixSiteWeb: "oui", url: publication.url }
          : { choixSiteWeb: "non", modalités: publication.modalities || "" }),
      };
    }

    dto["resultat-global"] = {
      index: obj.index?.getValue(),
      mesures: obj.correctiveMeasures?.getValue() ?? CorrectiveMeasures.Enum.NOT_CONSIDERED,
      points: obj.points?.getValue() ?? 0,
      pointsCalculables: obj.computablePoints?.getValue() ?? 0,
    };

    // Indicators.
    const salaryRaises = obj.salaryRaises;
    if (salaryRaises) {
      if (salaryRaises.notComputableReason) {
        dto["augmentations"] = {
          estCalculable: "non",
          motifNonCalculabilité: salaryRaises.notComputableReason.getValue(),
        };
      } else {
        dto["augmentations"] = {
          estCalculable: "oui",
          note: salaryRaises.score?.getValue() ?? 0,
          résultat: salaryRaises.result?.getValue() ?? 0,
          populationFavorable: salaryRaises.favorablePopulation?.getValue() ?? FavorablePopulation.Enum.EQUALITY,
          catégories: [
            { nom: CSP.Enum.OUVRIERS, écarts: salaryRaises.categories[0]?.getValue() || null },
            { nom: CSP.Enum.EMPLOYES, écarts: salaryRaises.categories[1]?.getValue() || null },
            { nom: CSP.Enum.TECHNICIENS_AGENTS_MAITRISES, écarts: salaryRaises.categories[2]?.getValue() || null },
            { nom: CSP.Enum.INGENIEURS_CADRES, écarts: salaryRaises.categories[3]?.getValue() || null },
          ],
        };
      }
    }

    const promotions = obj.promotions;
    if (promotions) {
      if (promotions.notComputableReason) {
        dto["promotions"] = {
          estCalculable: "non",
          motifNonCalculabilité: promotions.notComputableReason.getValue(),
        };
      } else {
        dto["promotions"] = {
          estCalculable: "oui",
          note: promotions.score?.getValue() ?? 0,
          résultat: promotions.result?.getValue() ?? 0,
          populationFavorable: promotions.favorablePopulation?.getValue() ?? FavorablePopulation.Enum.EQUALITY,
          catégories: [
            { nom: "ouv", écarts: promotions?.categories?.[0]?.getValue() ?? null },
            { nom: "emp", écarts: promotions?.categories?.[1]?.getValue() ?? null },
            { nom: "tam", écarts: promotions?.categories?.[2]?.getValue() ?? null },
            { nom: "ic", écarts: promotions?.categories?.[3]?.getValue() ?? null },
          ],
        };
      }
    }

    const salaryRaisesAndPromotions = obj.salaryRaisesAndPromotions;
    if (salaryRaisesAndPromotions) {
      if (salaryRaisesAndPromotions.notComputableReason) {
        dto["augmentations-et-promotions"] = {
          estCalculable: "non",
          motifNonCalculabilité: salaryRaisesAndPromotions.notComputableReason.getValue(),
        };
      } else {
        dto["augmentations-et-promotions"] = {
          estCalculable: "oui",
          note: salaryRaisesAndPromotions.score?.getValue() ?? 0,
          noteNombreSalaries: salaryRaisesAndPromotions.employeesCountScore?.getValue() ?? 0,
          notePourcentage: salaryRaisesAndPromotions.percentScore?.getValue() ?? 0,
          populationFavorable:
            salaryRaisesAndPromotions.favorablePopulation?.getValue() ?? FavorablePopulation.Enum.EQUALITY,
          résultat: salaryRaisesAndPromotions.result?.getValue() ?? 0,
          résultatEquivalentSalarié: salaryRaisesAndPromotions.employeesCountResult?.getValue() ?? 0,
        };
      }
    }

    const remunerations = obj.remunerations;
    if (remunerations) {
      dto["remunerations-resultat"] = {
        note: remunerations.score?.getValue() ?? 0,
        populationFavorable: remunerations.favorablePopulation?.getValue() ?? FavorablePopulation.Enum.EQUALITY,
        résultat: remunerations.result?.getValue() ?? 0,
      };

      if (remunerations.notComputableReason) {
        dto["remunerations"] = {
          estCalculable: "non",
          motifNonCalculabilité: remunerations.notComputableReason.getValue(),
          déclarationCalculCSP: true,
        };
      } else {
        dto["remunerations"] = {
          estCalculable: "oui",
          mode: remunerations.mode?.getValue(),
          cse: remunerations.cseConsultationDate
            ? "oui"
            : // If mode !== "csp", cse must be defined. So, there is no cse date, we infer cse === "non".
            remunerations.mode?.getValue() !== RemunerationsMode.Enum.CSP
            ? "non"
            : undefined,
          dateConsultationCSE: remunerations.cseConsultationDate
            ? dateObjectToDateISOString(remunerations.cseConsultationDate)
            : undefined,
        };
      }
    }

    if (remunerations?.mode?.getValue() === RemunerationsMode.Enum.OTHER_LEVEL) {
      dto["remunerations-coefficient-autre"] = {
        catégories: remunerations?.categories.map(category => ({
          nom: category.name || "",
          tranches: {
            [AgeRange.Enum.LESS_THAN_30]: category.ranges?.[":29"]?.getValue() || null,
            [AgeRange.Enum.FROM_30_TO_39]: category.ranges?.["30:39"]?.getValue() || null,
            [AgeRange.Enum.FROM_40_TO_49]: category.ranges?.["40:49"]?.getValue() || null,
            [AgeRange.Enum.FROM_50_TO_MORE]: category.ranges?.["50:"]?.getValue() || null,
          },
        })),
      };
    }

    if (remunerations?.mode?.getValue() === RemunerationsMode.Enum.BRANCH_LEVEL) {
      dto["remunerations-coefficient-branche"] = {
        catégories: remunerations?.categories.map(category => ({
          nom: category.name || "",
          tranches: {
            [AgeRange.Enum.LESS_THAN_30]: category.ranges?.[":29"]?.getValue() || null,
            [AgeRange.Enum.FROM_30_TO_39]: category.ranges?.["30:39"]?.getValue() || null,
            [AgeRange.Enum.FROM_40_TO_49]: category.ranges?.["40:49"]?.getValue() || null,
            [AgeRange.Enum.FROM_50_TO_MORE]: category.ranges?.["50:"]?.getValue() || null,
          },
        })),
      };
    }

    if (remunerations?.mode?.getValue() === RemunerationsMode.Enum.CSP) {
      dto["remunerations-csp"] = {
        catégories: [
          {
            nom: "ouv",
            tranches: {
              [AgeRange.Enum.LESS_THAN_30]: remunerations.categories[0].ranges?.[":29"]?.getValue() || null,
              [AgeRange.Enum.FROM_30_TO_39]: remunerations.categories[0].ranges?.["30:39"]?.getValue() || null,
              [AgeRange.Enum.FROM_40_TO_49]: remunerations.categories[0].ranges?.["40:49"]?.getValue() || null,
              [AgeRange.Enum.FROM_50_TO_MORE]: remunerations.categories[0].ranges?.["50:"]?.getValue() || null,
            },
          },
          {
            nom: "emp",
            tranches: {
              [AgeRange.Enum.LESS_THAN_30]: remunerations.categories[1].ranges?.[":29"]?.getValue() || null,
              [AgeRange.Enum.FROM_30_TO_39]: remunerations.categories[1].ranges?.["30:39"]?.getValue() || null,
              [AgeRange.Enum.FROM_40_TO_49]: remunerations.categories[1].ranges?.["40:49"]?.getValue() || null,
              [AgeRange.Enum.FROM_50_TO_MORE]: remunerations.categories[1].ranges?.["50:"]?.getValue() || null,
            },
          },
          {
            nom: "tam",
            tranches: {
              [AgeRange.Enum.LESS_THAN_30]: remunerations.categories[2].ranges?.[":29"]?.getValue() || null,
              [AgeRange.Enum.FROM_30_TO_39]: remunerations.categories[2].ranges?.["30:39"]?.getValue() || null,
              [AgeRange.Enum.FROM_40_TO_49]: remunerations.categories[2].ranges?.["40:49"]?.getValue() || null,
              [AgeRange.Enum.FROM_50_TO_MORE]: remunerations.categories[2].ranges?.["50:"]?.getValue() || null,
            },
          },
          {
            nom: "ic",
            tranches: {
              [AgeRange.Enum.LESS_THAN_30]: remunerations.categories[3].ranges?.[":29"]?.getValue() || null,
              [AgeRange.Enum.FROM_30_TO_39]: remunerations.categories[3].ranges?.["30:39"]?.getValue() || null,
              [AgeRange.Enum.FROM_40_TO_49]: remunerations.categories[3].ranges?.["40:49"]?.getValue() || null,
              [AgeRange.Enum.FROM_50_TO_MORE]: remunerations.categories[3].ranges?.["50:"]?.getValue() || null,
            },
          },
        ],
      };
    }

    const maternityLeaves = obj.maternityLeaves;
    if (maternityLeaves) {
      if (maternityLeaves.notComputableReason) {
        dto["conges-maternite"] = {
          estCalculable: "non",
          motifNonCalculabilité: maternityLeaves.notComputableReason.getValue(),
        };
      } else {
        dto["conges-maternite"] = {
          estCalculable: "oui",
          note: maternityLeaves.score?.getValue() ?? 0,
          résultat: maternityLeaves.result?.getValue() ?? 0,
        };
      }
    }

    const highRemunerations = obj.highRemunerations;
    if (highRemunerations) {
      dto["hautes-remunerations"] = {
        note: obj.highRemunerations.score.getValue(),
        populationFavorable: obj.highRemunerations.favorablePopulation.getValue(),
        résultat: obj.highRemunerations.result.getValue(),
      };
    }

    return dto;
  },

  toPersistence(obj) {
    return {
      declarant: obj.declarant.email.getValue(),
      declared_at: obj.declaredAt,
      ft: "", // TODO
      modified_at: obj.modifiedAt,
      siren: obj.siren.getValue(),
      year: obj.year.getValue(),
      data: toDeclarationDataRaw(obj, true),
    };
  },
};

function toDeclarationDataRaw(data: Declaration, skipUndefined = false): DeclarationDataRaw {
  type Categories = NonNullable<Remunerations["catégories"]>[number];
  type Tranche = NonNullable<Effectif["tranche"]>;

  const defaultCategories: CategoriesSimples = [null, null, null, null];

  const raw: DeclarationDataRaw = {
    déclarant: {
      email: data.declarant.email.getValue(),
      nom: data.declarant.lastname,
      prénom: data.declarant.firstname,
      téléphone: data.declarant.phone,
    },
    déclaration: {
      // année_indicateurs: data.declaration.indicatorsYear.getValue() as AnneeIndicateur,
      année_indicateurs: data.year.getValue() as AnneeIndicateur,
      date: data.declaredAt ? dateObjectToDateTimeISOString(data.declaredAt) : void 0,
      fin_période_référence: data.endReferencePeriod ? dateObjectToDateISOString(data.endReferencePeriod) : void 0,
      index: data.index?.getValue(),
      mesures_correctives: data.correctiveMeasures?.getValue(),
      points: data.points?.getValue(),
      points_calculables: data.computablePoints?.getValue(),
      publication: {
        date: data.publication?.date ? dateObjectToDateISOString(data.publication?.date) : void 0,
        date_publication_mesures: data.publication?.measuresPublishDate
          ? dateObjectToDateISOString(data.publication?.measuresPublishDate)
          : void 0,
        date_publication_objectifs: data.publication?.objectivesPublishDate
          ? dateObjectToDateISOString(data.publication?.objectivesPublishDate)
          : void 0,
        modalités: data.publication?.modalities,
        modalités_objectifs_mesures: data.publication?.objectivesMeasuresModalities,
        url: data.publication?.url,
      },
      période_suffisante: data.sufficientPeriod,
    },
    entreprise: {
      siren: data.company.siren.getValue(),
      adresse: data.company.address,
      code_naf: data.company.nafCode.getValue(),
      code_pays: data.company.countryCode?.getValue() as CodePays,
      code_postal: data.company.postalCode?.getValue(),
      commune: data.company.city,
      département: data.company.county?.getValue() as CodeDepartement,
      effectif: {
        total: data.company.total?.getValue(),
        tranche: data.company.range?.getValue() as Tranche,
      },
      plan_relance: data.company.hasRecoveryPlan,
      raison_sociale: data.company.name,
      région: data.company.region?.getValue() as CodeRegion,
      ...(data.company.ues
        ? {
            ues: {
              entreprises: data.company.ues.companies.map<EntrepriseSummary>(company => ({
                raison_sociale: company.name,
                siren: company.siren.getValue(),
              })),
              nom: data.company.ues.name,
            },
          }
        : {}),
    },
    source: data.source.getValue(),
  };

  raw.indicateurs = {};

  if (data.salaryRaises)
    raw.indicateurs.augmentations = {
      catégories: data.salaryRaises.categories.map(cat => cat?.getValue() ?? null) ?? defaultCategories,
      non_calculable: data.salaryRaises.notComputableReason?.getValue() as Any,
      note: data.salaryRaises.score?.getValue(),
      objectif_de_progression: data.salaryRaises.progressObjective,
      population_favorable:
        data.salaryRaises.favorablePopulation?.getValue() === FavorablePopulation.Enum.EQUALITY
          ? ""
          : (data.salaryRaises.favorablePopulation?.getValue() as PopulationFavorable),
      résultat: data.salaryRaises.result?.getValue(),
    };

  if (data.salaryRaisesAndPromotions)
    raw.indicateurs.augmentations_et_promotions = {
      note: data.salaryRaisesAndPromotions.score?.getValue(),
      non_calculable: data.salaryRaisesAndPromotions.notComputableReason?.getValue() as Any,
      résultat: data.salaryRaisesAndPromotions.result?.getValue(),
      note_en_pourcentage: data.salaryRaisesAndPromotions.percentScore?.getValue(),
      note_nombre_salariés: data.salaryRaisesAndPromotions.employeesCountScore?.getValue(),
      objectif_de_progression: data.salaryRaisesAndPromotions.progressObjective,
      population_favorable:
        data.salaryRaisesAndPromotions.favorablePopulation?.getValue() === FavorablePopulation.Enum.EQUALITY
          ? ""
          : (data.salaryRaisesAndPromotions.favorablePopulation?.getValue() as PopulationFavorable),
      résultat_nombre_salariés: data.salaryRaisesAndPromotions.employeesCountResult?.getValue(),
    };

  if (data.maternityLeaves)
    raw.indicateurs.congés_maternité = {
      note: data.maternityLeaves.score?.getValue(),
      résultat: data.maternityLeaves.result?.getValue(),
      non_calculable: data.maternityLeaves.notComputableReason?.getValue() as Any,
      objectif_de_progression: data.maternityLeaves.progressObjective,
    };

  if (data.highRemunerations)
    raw.indicateurs.hautes_rémunérations = {
      note: data.highRemunerations.score?.getValue(),
      résultat: data.highRemunerations.result?.getValue(),
      objectif_de_progression: data.highRemunerations.progressObjective ?? "",
      population_favorable:
        data.highRemunerations.favorablePopulation?.getValue() === FavorablePopulation.Enum.EQUALITY
          ? ""
          : (data.highRemunerations.favorablePopulation?.getValue() as PopulationFavorable),
    };

  if (data.promotions)
    raw.indicateurs.promotions = {
      note: data.promotions.score?.getValue(),
      non_calculable: data.promotions.notComputableReason?.getValue() as Any,
      résultat: data.promotions.result?.getValue(),
      objectif_de_progression: data.promotions.progressObjective,
      population_favorable:
        data.promotions.favorablePopulation?.getValue() === FavorablePopulation.Enum.EQUALITY
          ? ""
          : (data.promotions.favorablePopulation?.getValue() as PopulationFavorable),
      catégories: data.promotions.categories.map(cat => cat?.getValue() ?? null) ?? defaultCategories,
    };

  if (data.remunerations)
    raw.indicateurs.rémunérations = {
      note: data.remunerations.score?.getValue(),
      non_calculable: data.remunerations.notComputableReason?.getValue() as Any,
      résultat: data.remunerations.result?.getValue(),
      objectif_de_progression: data.remunerations.progressObjective,
      population_favorable:
        data.remunerations.favorablePopulation?.getValue() === FavorablePopulation.Enum.EQUALITY
          ? ""
          : (data.remunerations.favorablePopulation?.getValue() as PopulationFavorable),
      catégories: data.remunerations.categories.map<Categories>(cat => ({
        nom: cat.name,
        tranches: {
          "30:39": cat.ranges?.["30:39"]?.getValue(),
          "40:49": cat.ranges?.["40:49"]?.getValue(),
          "50:": cat.ranges?.["50:"]?.getValue(),
          ":29": cat.ranges?.[":29"]?.getValue(),
        },
      })),
      date_consultation_cse: data.remunerations.cseConsultationDate
        ? dateObjectToDateISOString(data.remunerations.cseConsultationDate)
        : void 0,
      mode: data.remunerations.mode?.getValue(),
    };

  if (skipUndefined) {
    return omitByRecursively(raw, isUndefined) as unknown as DeclarationDataRaw;
  }

  return raw;
}
