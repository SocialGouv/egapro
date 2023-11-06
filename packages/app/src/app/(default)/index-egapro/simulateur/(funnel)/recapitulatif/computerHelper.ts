import { IndexComputer } from "@common/core-domain/computers/IndexComputer";
import { IndicateurCinqComputer } from "@common/core-domain/computers/IndicateurCinqComputer";
import { IndicateurDeuxComputer, type Percentages } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicateurQuatreComputer } from "@common/core-domain/computers/IndicateurQuatreComputer";
import { IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type ExternalRemunerations, flattenRemunerations } from "@common/core-domain/computers/utils";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import {
  type CreateSimulationDTO,
  isCreateSimulationWorkforceRangeLessThan250DTO,
} from "@common/core-domain/dtos/CreateSimulationDTO";

import { getCspRemuWithCount, getPourcentagesAugmentationPromotionsWithCount, getTotalsCsp } from "../utils";

export const computerHelper = (funnel: CreateSimulationDTO) => {
  // init computers
  const computerIndicateurUn = new IndicateurUnComputer();
  computerIndicateurUn.setMode(funnel.indicateur1.mode);
  const computerIndicateurDeuxTrois = new IndicateurDeuxTroisComputer(computerIndicateurUn);
  const computerIndicateurDeux = new IndicateurDeuxComputer(computerIndicateurUn);
  const computerIndicateurTrois = new IndicateurTroisComputer(computerIndicateurUn);
  const computerIndicateurQuatre = new IndicateurQuatreComputer();
  const computerIndicateurCinq = new IndicateurCinqComputer();

  // prepare inputs
  const [totalWomen, totalMen] = getTotalsCsp(funnel);
  const isLessThan250 = isCreateSimulationWorkforceRangeLessThan250DTO(funnel);
  const remuWithCount =
    funnel.indicateur1.mode === RemunerationsMode.Enum.CSP
      ? getCspRemuWithCount(funnel.effectifs.csp, funnel.indicateur1.remunerations as ExternalRemunerations)
      : (funnel.indicateur1.remunerations as ExternalRemunerations);

  // set inputs
  computerIndicateurUn.setInput(flattenRemunerations(remuWithCount));
  if (isLessThan250) {
    if (funnel.indicateur2and3.calculable) {
      computerIndicateurDeuxTrois.setInput({
        ...funnel.indicateur2and3.raisedCount,
        menCount: totalMen,
        womenCount: totalWomen,
      });
    }
  } else {
    if (funnel.indicateur2.calculable) {
      computerIndicateurDeux.setInput(
        getPourcentagesAugmentationPromotionsWithCount(
          funnel.effectifs.csp,
          funnel.indicateur2.pourcentages as Percentages,
        ),
      );
    }

    if (funnel.indicateur3.calculable) {
      computerIndicateurTrois.setInput(
        getPourcentagesAugmentationPromotionsWithCount(
          funnel.effectifs.csp,
          funnel.indicateur3.pourcentages as Percentages,
        ),
      );
    }
  }
  if (funnel.indicateur4.calculable) {
    computerIndicateurQuatre.setInput(funnel.indicateur4.count);
  }
  computerIndicateurCinq.setInput(funnel.indicateur5);

  // compute results
  const resultIndicateurUn = computerIndicateurUn.compute();
  const resultIndicateurDeuxTrois =
    isLessThan250 && funnel.indicateur2and3.calculable && computerIndicateurDeuxTrois.compute();
  const resultIndicateurDeux = !isLessThan250 && funnel.indicateur2.calculable && computerIndicateurDeux.compute();
  const resultIndicateurTrois = !isLessThan250 && funnel.indicateur3.calculable && computerIndicateurTrois.compute();
  const resultIndicateurQuatre = funnel.indicateur4.calculable && computerIndicateurQuatre.compute();
  const resultIndicateurCinq = computerIndicateurCinq.compute();

  // total index
  const indexComputer = new IndexComputer(
    funnel.effectifs.workforceRange,
    isLessThan250
      ? [
          computerIndicateurUn,
          funnel.indicateur2and3.calculable ? computerIndicateurDeuxTrois : null,
          funnel.indicateur4.calculable ? computerIndicateurQuatre : null,
          computerIndicateurCinq,
        ]
      : [
          computerIndicateurUn,
          funnel.indicateur2.calculable ? computerIndicateurDeux : null,
          funnel.indicateur3.calculable ? computerIndicateurTrois : null,
          funnel.indicateur4.calculable ? computerIndicateurQuatre : null,
          computerIndicateurCinq,
        ],
  );
  const resultIndex = indexComputer.compute();

  return {
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
  };
};
