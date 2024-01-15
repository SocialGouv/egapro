import { type ComputedResult } from "@common/core-domain/computers/AbstractComputer";
import { type IndicateurDeuxComputer } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { type IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import {
  type CreateSimulationDTO,
  isCreateSimulationWorkforceRangeLessThan250DTO,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";

import { computerHelper } from "./computerHelper";

// TODO: use toBinaryFavorablePopulation instead when refactor is made on ComputedResult.favorablePopulation.
const toFavorablePopulation = (populationFavorable: ComputedResult["favorablePopulation"]) =>
  populationFavorable === "equality"
    ? undefined
    : populationFavorable === "men"
      ? FavorablePopulation.Enum.MEN
      : FavorablePopulation.Enum.WOMEN;

const computeGroupIndicateurUn = (computerIndicateurUn: IndicateurUnComputer) => (key: string) => {
  if (!computerIndicateurUn.canComputeGroup(key)) return "";
  const { resultRaw } = computerIndicateurUn.computeGroupBeforeThresholdApplication(key);
  return Math.round(resultRaw * 1000) / 1000;
};

function computeIndicateurDeuxOuTrois(
  computerIndicateurDeuxOuTrois: IndicateurDeuxComputer | IndicateurTroisComputer,
  categoryName: CSP.Enum = CSP.Enum.OUVRIERS,
) {
  if (!computerIndicateurDeuxOuTrois.canComputeGroup(categoryName)) return "";
  const { resultRaw } = computerIndicateurDeuxOuTrois.computeGroupNonWeightedGap(categoryName);
  return Math.round(resultRaw * 1000) / 1000;
}

/**
 * Transform a simulation object store to a declaration object store.
 *
 */
export const simuFunnelToDeclarationDTO = (simulation: CreateSimulationDTO): DeclarationDTO => {
  const {
    computerIndicateurUn,
    computerIndicateurDeux,
    computerIndicateurDeuxTrois,
    computerIndicateurTrois,
    computerIndicateurQuatre,
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
      if (!computerIndicateurDeuxTrois.canCompute()) {
        dto["augmentations-et-promotions"] = {
          estCalculable: "non",
          motifNonCalculabilité: NotComputableReason.Enum.ETSNO5F5H,
        };
      } else if (indicateur2et3.calculable === "non") {
        dto["augmentations-et-promotions"] = {
          estCalculable: "non",
          motifNonCalculabilité: NotComputableReason.Enum.ABSAUGI,
        };
      } else if (indicateur2et3.calculable === "oui" && resultIndicateurDeuxTrois) {
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
  } else {
    const indicateur2 = simulation.indicateur2;
    if (indicateur2) {
      if (!computerIndicateurDeux.canCompute()) {
        dto["augmentations"] = {
          estCalculable: "non",
          motifNonCalculabilité: NotComputableReason.Enum.EGVI40PCET,
        };
      } else if (indicateur2.calculable === "non") {
        dto["augmentations"] = {
          estCalculable: "non",
          motifNonCalculabilité: NotComputableReason.Enum.ABSAUGI,
        };
      } else if (indicateur2.calculable === "oui" && resultIndicateurDeux) {
        dto["augmentations"] = {
          estCalculable: "oui",
          catégories: {
            [CSP.Enum.OUVRIERS]: computeIndicateurDeuxOuTrois(computerIndicateurDeux, CSP.Enum.OUVRIERS),
            [CSP.Enum.EMPLOYES]: computeIndicateurDeuxOuTrois(computerIndicateurDeux, CSP.Enum.EMPLOYES),
            [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: computeIndicateurDeuxOuTrois(
              computerIndicateurDeux,
              CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
            ),
            [CSP.Enum.INGENIEURS_CADRES]: computeIndicateurDeuxOuTrois(
              computerIndicateurDeux,
              CSP.Enum.INGENIEURS_CADRES,
            ),
          },
          note: resultIndicateurDeux.note,
          populationFavorable: toFavorablePopulation(resultIndicateurDeux.favorablePopulation), // TODO: Use the FavorablePopulation.Enum instead.
          résultat: resultIndicateurDeux.result,
        };
      }
    }

    const indicateur3 = simulation.indicateur3;
    if (indicateur3) {
      if (!computerIndicateurTrois.canCompute()) {
        dto["promotions"] = {
          estCalculable: "non",
          motifNonCalculabilité: NotComputableReason.Enum.EGVI40PCET,
        };
      } else if (indicateur3.calculable === "non") {
        dto["promotions"] = {
          estCalculable: "non",
          motifNonCalculabilité: NotComputableReason.Enum.ABSPROM,
        };
      } else if (indicateur3.calculable === "oui" && resultIndicateurTrois) {
        dto["promotions"] = {
          estCalculable: "oui",
          catégories: {
            [CSP.Enum.OUVRIERS]: computeIndicateurDeuxOuTrois(computerIndicateurTrois, CSP.Enum.OUVRIERS),
            [CSP.Enum.EMPLOYES]: computeIndicateurDeuxOuTrois(computerIndicateurTrois, CSP.Enum.EMPLOYES),
            [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: computeIndicateurDeuxOuTrois(
              computerIndicateurTrois,
              CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
            ),
            [CSP.Enum.INGENIEURS_CADRES]: computeIndicateurDeuxOuTrois(
              computerIndicateurTrois,
              CSP.Enum.INGENIEURS_CADRES,
            ),
          },
          note: resultIndicateurTrois.note,
          populationFavorable: toFavorablePopulation(resultIndicateurTrois.favorablePopulation),
          résultat: resultIndicateurTrois.result,
        };
      }
    }
  }

  const indicateur1 = simulation.indicateur1;

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

  if (!computerIndicateurUn.canCompute()) {
    dto["remunerations"] = {
      déclarationCalculCSP: false,
      estCalculable: "non",
      motifNonCalculabilité: NotComputableReason.Enum.EGVI40PCET,
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
      catégories: indicateur1.remunerations.map(({ name: nom }) => ({
        nom,
        tranches: {
          [AgeRange.Enum.LESS_THAN_30]: computeGroupIndicateurUn(computerIndicateurUn)(`${nom}::29`),
          [AgeRange.Enum.FROM_30_TO_39]: computeGroupIndicateurUn(computerIndicateurUn)(`${nom}:30:39`),
          [AgeRange.Enum.FROM_40_TO_49]: computeGroupIndicateurUn(computerIndicateurUn)(`${nom}:40:49`),
          [AgeRange.Enum.FROM_50_TO_MORE]: computeGroupIndicateurUn(computerIndicateurUn)(`${nom}:50:`),
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
      })) as Exclude<DeclarationDTO["remunerations-csp"], undefined>["catégories"],
    };
  }

  const indicateur4 = simulation.indicateur4;

  if (indicateur4) {
    if (!computerIndicateurQuatre.canCompute() && resultIndicateurQuatre) {
      dto["conges-maternite"] = {
        estCalculable: "non",
        motifNonCalculabilité: NotComputableReason.Enum.ABSAUGPDTCM,
      };
    } else if (!indicateur4.calculable) {
      dto["conges-maternite"] = {
        estCalculable: "non",
        motifNonCalculabilité: NotComputableReason.Enum.ABSRCM,
      };
    } else if (indicateur4.calculable && resultIndicateurQuatre) {
      dto["conges-maternite"] = {
        estCalculable: "oui",
        note: resultIndicateurQuatre.note,
        résultat: Math.floor(resultIndicateurQuatre.result * 100),
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
