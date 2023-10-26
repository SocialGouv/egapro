import { type Declaration } from "@common/core-domain/domain/Declaration";
import { type CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import {
  type CreateSimulationDTO,
  isCreateSimulationWorkforceRangeLessThan250DTO,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { dateObjectToDateISOString } from "@common/utils/date";
import { Object } from "@common/utils/overload";

import { computerHelper } from "./computerHelper";

export const simuFunnelToDeclarationDTO = (obj: Declaration): DeclarationDTO => {
  const simulation = {} as CreateSimulationDTO;

  const {
    computerIndicateurUn,
    computerIndicateurDeuxTrois,
    computerIndicateurDeux,
    computerIndicateurTrois,
    computerIndicateurQuatre,
    computerIndicateurCinq,
    totalWomen,
    totalMen,
    remuWithCount,
    resultIndicateurUn,
    resultIndicateurDeuxTrois,
    resultIndicateurDeux,
    resultIndicateurTrois,
    resultIndicateurQuatre,
    resultIndicateurCinq,
    indexComputer,
    resultIndex,
  } = computerHelper(simulation);

  const dto = {
    // commencer: {
    //   annéeIndicateurs: obj.year.getValue(),
    //   siren: obj.siren.getValue(),
    // },
    "declaration-existante": {
      status: "creation",
      // date: dateObjectToDateISOString(obj.declaredAt),
    },
    // declarant: {
    //   accordRgpd: true,
    //   email: obj.declarant.email.getValue(),
    //   nom: obj.declarant.lastname || "",
    //   prénom: obj.declarant.firstname || "",
    //   téléphone: obj.declarant.phone || "",
    // },
    // entreprise: {
    //   tranche: obj.company.range?.getValue(),
    //   type: obj.company.ues ? "ues" : "entreprise",
    //   entrepriseDéclarante: {
    //     siren: obj.siren.getValue(),
    //     adresse: obj.company.address || "",
    //     codeNaf: obj.company.nafCode.getValue(),
    //     raisonSociale: obj.company.name,
    //     codePays: obj.company.countryCode?.getValue(),
    //     codePostal: obj.company.postalCode?.getValue(),
    //     commune: obj.company.city,
    //     département: obj.company.county?.getValue(),
    //     région: obj.company.region?.getValue(),
    //   },
    // },
  } as DeclarationDTO;

  // if (obj.company.ues && obj.company.ues.companies.length > 0) {
  //   dto["ues"] = {
  //     entreprises: obj.company.ues.companies.map(company => ({
  //       raisonSociale: company.name,
  //       siren: company.siren.getValue(),
  //     })),
  //     nom: obj.company.ues?.name || "",
  //   };
  // }

  // if (!obj.sufficientPeriod) {
  //   dto["periode-reference"] = {
  //     périodeSuffisante: "non",
  //   };
  // } else {
  //   dto["periode-reference"] = {
  //     périodeSuffisante: "oui",
  //     effectifTotal: obj.company.total?.getValue() ?? 0,
  //     finPériodeRéférence: obj.endReferencePeriod ? dateObjectToDateISOString(obj.endReferencePeriod) : "",
  //   };
  // }

  // const publication = obj.publication;
  // if (publication) {
  //   dto["publication"] = {
  //     date: publication.date ? dateObjectToDateISOString(publication.date) : "",
  //     planRelance: obj.company.hasRecoveryPlan ? "oui" : "non",
  //     ...(publication.url
  //       ? { choixSiteWeb: "oui", url: publication.url }
  //       : { choixSiteWeb: "non", modalités: publication.modalities || "" }),
  //   };
  // }

  // dto["resultat-global"] = {
  //   index: obj.index?.getValue(),
  //   mesures: obj.correctiveMeasures?.getValue(),
  //   points: obj.points?.getValue() ?? 0,
  //   pointsCalculables: obj.computablePoints?.getValue() ?? 0,
  // };

  // Indicators.
  if (isCreateSimulationWorkforceRangeLessThan250DTO(simulation)) {
  } else {
    const salaryRaises = simulation.indicateur2;

    type CatégoriesAugmentations = Exclude<
      NonNullable<DeclarationDTO["augmentations"]>,
      { estCalculable: "non" }
    >["catégories"];
    if (salaryRaises.calculable && resultIndicateurDeux) {
      dto["augmentations"] = {
        estCalculable: "oui",
        catégories: Object.keys(salaryRaises.pourcentages).map(csp => ({
          nom: csp,
          écarts: computerIndicateurDeux.computeGroup(csp as CSP.Enum).result,
        })) as CatégoriesAugmentations,
        note: resultIndicateurDeux.note,
        populationFavorable:
          resultIndicateurDeux.genderAdvantage === "equality"
            ? FavorablePopulation.Enum.EQUALITY
            : resultIndicateurDeux.genderAdvantage === "men"
            ? FavorablePopulation.Enum.MEN
            : FavorablePopulation.Enum.WOMEN,
        résultat: resultIndicateurDeux.result,
      };
    }

    const promotions = simulation.indicateur3;

    type CatégoriesPromotions = Exclude<
      NonNullable<DeclarationDTO["promotions"]>,
      { estCalculable: "non" }
    >["catégories"];
    if (promotions.calculable && resultIndicateurTrois) {
      dto["promotions"] = {
        estCalculable: "oui",
        catégories: Object.keys(promotions.pourcentages).map(csp => ({
          nom: csp,
          écarts: computerIndicateurTrois.computeGroup(csp as CSP.Enum).result,
        })) as CatégoriesPromotions,
        note: resultIndicateurTrois.note,
        populationFavorable:
          resultIndicateurTrois.genderAdvantage === "equality"
            ? FavorablePopulation.Enum.EQUALITY
            : resultIndicateurTrois.genderAdvantage === "men"
            ? FavorablePopulation.Enum.MEN
            : FavorablePopulation.Enum.WOMEN,
        résultat: resultIndicateurTrois.result,
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
      note: obj.highRemunerations!.score.getValue(),
      populationFavorable: obj.highRemunerations!.favorablePopulation.getValue(),
      résultat: obj.highRemunerations!.result.getValue(),
    };
  }

  return dto;
};
