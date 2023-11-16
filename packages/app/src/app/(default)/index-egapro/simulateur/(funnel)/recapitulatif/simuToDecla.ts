import { type ComputedResult, resultWithSign } from "@common/core-domain/computers/AbstractComputer";
import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import {
  type CreateSimulationDTO,
  isCreateSimulationWorkforceRangeLessThan250DTO,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { Object } from "@common/utils/overload";

import { computerHelper } from "./computerHelper";

// TODO: use toBinaryFavorablePopulation instead when refactor is made on ComputedResult.favorablePopulation.
const toFavorablePopulation = (populationFavorable: ComputedResult["favorablePopulation"]) =>
  populationFavorable === "equality"
    ? undefined
    : populationFavorable === "men"
    ? FavorablePopulation.Enum.MEN
    : FavorablePopulation.Enum.WOMEN;

const computeGroupIndicateurUn = (computerIndicateurUn: IndicateurUnComputer) => (key: string) =>
  !computerIndicateurUn.canComputeGroup(key) ? null : resultWithSign(computerIndicateurUn.computeGroup(key));

export const simuFunnelToDeclarationDTO = (simulation: CreateSimulationDTO): DeclarationDTO => {
  const {
    computerIndicateurUn,
    computerIndicateurDeux,
    computerIndicateurTrois,
    totalWomen,
    totalMen,
    resultIndicateurUn,
    resultIndicateurDeuxTrois,
    resultIndicateurDeux,
    resultIndicateurTrois,
    resultIndicateurQuatre,
    resultIndicateurCinq,
  } = computerHelper(simulation);

  const dto = {
    "declaration-existante": {
      status: "creation",
    },
    // It seems a good idea to preload effectif. Downside: we preload this step with "périodeSuffisante" to true.
    "periode-reference": {
      périodeSuffisante: "oui",
      effectifTotal: totalWomen + totalMen,
      finPériodeRéférence: "",
    },
    entreprise: {
      tranche: simulation.effectifs.workforceRange,
    },
  } as DeclarationDTO;

  // We don't fill "resultat-global" because it is will be recompute by the frontend.

  // dto["resultat-global"] = {
  //   index: obj.index?.getValue(),
  //   mesures: obj.correctiveMeasures?.getValue(),
  //   points: obj.points?.getValue() ?? 0,
  //   pointsCalculables: obj.computablePoints?.getValue() ?? 0,
  // };

  // Indicators.
  if (isCreateSimulationWorkforceRangeLessThan250DTO(simulation)) {
    const indicateur2et3 = simulation.indicateur2and3;

    if (indicateur2et3) {
      if (indicateur2et3.calculable && resultIndicateurDeuxTrois) {
        {
          dto["augmentations-et-promotions"] = {
            estCalculable: "oui",
            note: resultIndicateurDeuxTrois.note,
            noteNombreSalaries: resultIndicateurDeuxTrois.noteEquivalentEmployeeCountGap,
            notePourcentage: resultIndicateurDeuxTrois.notePercent,
            populationFavorable: toFavorablePopulation(resultIndicateurDeuxTrois.favorablePopulation),
            résultat: resultIndicateurDeuxTrois.result,
            résultatEquivalentSalarié: resultIndicateurDeuxTrois.equivalentEmployeeCountGap,
          };
        }
      }
    }
  } else {
    const indicateur2 = simulation.indicateur2;

    type CatégoriesAugmentations = Extract<DeclarationDTO["augmentations"], { estCalculable: "oui" }>["catégories"];
    // We only care of filling the indicator if it is computable.
    if (indicateur2.calculable && resultIndicateurDeux) {
      dto["augmentations"] = {
        estCalculable: "oui",
        catégories: Object.keys(indicateur2.pourcentages).map(csp => ({
          nom: csp,
          écarts: resultWithSign(computerIndicateurDeux.computeGroup(csp as CSP.Enum)),
        })) as CatégoriesAugmentations,
        note: resultIndicateurDeux.note,
        populationFavorable: toFavorablePopulation(resultIndicateurDeux.favorablePopulation), // TODO: Use the FavorablePopulation.Enum instead.
        résultat: resultIndicateurDeux.result,
      };
    }

    const promotions = simulation.indicateur3;

    type CatégoriesPromotions = Extract<
      NonNullable<DeclarationDTO["promotions"]>,
      { estCalculable: "oui" }
    >["catégories"];
    if (promotions.calculable && resultIndicateurTrois) {
      dto["promotions"] = {
        estCalculable: "oui",
        catégories: Object.keys(promotions.pourcentages).map(csp => ({
          nom: csp,
          écarts: resultWithSign(computerIndicateurTrois.computeGroup(csp as CSP.Enum)),
        })) as CatégoriesPromotions,
        note: resultIndicateurTrois.note,
        populationFavorable: toFavorablePopulation(resultIndicateurTrois.favorablePopulation),
        résultat: resultIndicateurTrois.result,
      };
    }
  }

  const indicateur1 = simulation.indicateur1;

  // TODO: The simulateur doesn't handle that indicateur1 can not be computable ??
  if (indicateur1.remunerations) {
    // Not mandatory, because the front can recompute this based on value in remunerations form data.
    dto["remunerations-resultat"] = {
      note: resultIndicateurUn.note,
      populationFavorable: toFavorablePopulation(resultIndicateurUn.favorablePopulation),
      résultat: resultIndicateurUn.result,
    };

    dto["remunerations"] = {
      estCalculable: "oui",
      mode: indicateur1.mode,
      cse: undefined,
      dateConsultationCSE: undefined,
    };
  }

  if (
    indicateur1.mode === RemunerationsMode.Enum.OTHER_LEVEL ||
    indicateur1.mode === RemunerationsMode.Enum.BRANCH_LEVEL
  ) {
    dto[
      indicateur1.mode === RemunerationsMode.Enum.OTHER_LEVEL
        ? "remunerations-coefficient-autre"
        : "remunerations-coefficient-branche"
    ] = {
      catégories: indicateur1.remunerations.map(({ name: nom, categoryId }) => ({
        nom,
        tranches: {
          [AgeRange.Enum.LESS_THAN_30]: computeGroupIndicateurUn(computerIndicateurUn)(`${categoryId}::29`),
          [AgeRange.Enum.FROM_30_TO_39]: computeGroupIndicateurUn(computerIndicateurUn)(`${categoryId}:30:39`) || null,
          [AgeRange.Enum.FROM_40_TO_49]: computeGroupIndicateurUn(computerIndicateurUn)(`${categoryId}:40:49`) || null,
          [AgeRange.Enum.FROM_50_TO_MORE]: computeGroupIndicateurUn(computerIndicateurUn)(`${categoryId}:50:`) || null,
        },
      })),
    };
  }

  if (indicateur1.mode === RemunerationsMode.Enum.CSP) {
    dto["remunerations-csp"] = {
      catégories: ["ouv", "emp", "tam", "ic"].map(nom => ({
        nom,
        tranches: {
          [AgeRange.Enum.LESS_THAN_30]: computeGroupIndicateurUn(computerIndicateurUn)(`${nom}::29`),
          [AgeRange.Enum.FROM_30_TO_39]: computeGroupIndicateurUn(computerIndicateurUn)(`${nom}:30:39`),
          [AgeRange.Enum.FROM_40_TO_49]: computeGroupIndicateurUn(computerIndicateurUn)(`${nom}:40:49`),
          [AgeRange.Enum.FROM_50_TO_MORE]: computeGroupIndicateurUn(computerIndicateurUn)(`${nom}:50:`),
        },
      })) as NonNullable<DeclarationDTO["remunerations-csp"]>["catégories"],
    };
  }

  const indicateur4 = simulation.indicateur4;

  if (indicateur4) {
    if (indicateur4.calculable && resultIndicateurQuatre) {
      dto["conges-maternite"] = {
        estCalculable: "oui",
        note: resultIndicateurQuatre.note,
        résultat: resultIndicateurQuatre.result,
      };
    }
  }

  const indicateur5 = simulation.indicateur5;
  if (indicateur5) {
    dto["hautes-remunerations"] = {
      note: resultIndicateurCinq.note,
      populationFavorable: toFavorablePopulation(resultIndicateurCinq.favorablePopulation),
      résultat: resultIndicateurCinq.result,
    };
  }

  return dto;
};
