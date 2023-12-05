import { type Percentages } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import {
  ageRanges,
  categories,
  type ExternalRemunerations,
  flattenRemunerations,
} from "@common/core-domain/computers/utils";
import { type CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type CreateSimulationDTO } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";

export const prepareIndicateurUnComputer = (
  computerIndicateurUn: IndicateurUnComputer,
  funnel: CreateSimulationDTO,
) => {
  const remuWithCount =
    funnel.indicateur1.mode === RemunerationsMode.Enum.CSP
      ? getCspRemuWithCount(funnel.effectifs.csp, funnel.indicateur1.remunerations as ExternalRemunerations)
      : (funnel.indicateur1.remunerations as ExternalRemunerations);
  computerIndicateurUn.setMode(funnel.indicateur1.mode);
  computerIndicateurUn.setInput(flattenRemunerations(remuWithCount));
  computerIndicateurUn.compute();
};

export const getCspRemuWithCount = (
  funnelCsp: CreateSimulationDTO["effectifs"]["csp"],
  remunerations: ExternalRemunerations | undefined,
) =>
  Object.keys(funnelCsp).map<ExternalRemunerations[number]>(categoryName => ({
    name: categoryName,
    category: ageRanges.reduce(
      (newAgeGroups, ageRange) => {
        const currentAgeRange = remunerations?.find(rem => rem?.name === categoryName)?.category?.[ageRange];
        return {
          ...newAgeGroups,
          [ageRange]: {
            womenSalary: currentAgeRange?.womenSalary ?? 0,
            menSalary: currentAgeRange?.menSalary ?? 0,
            womenCount: currentAgeRange?.womenCount ?? funnelCsp[categoryName].ageRanges[ageRange].women,
            menCount: currentAgeRange?.menCount ?? funnelCsp[categoryName].ageRanges[ageRange].men,
          },
        };
      },
      {} as ExternalRemunerations[number]["category"],
    ),
  }));

export const getPourcentagesAugmentationPromotionsWithCount = (
  funnelCsp: CreateSimulationDTO["effectifs"]["csp"],
  pourcentages: Percentages | undefined,
) =>
  Object.keys(funnelCsp).reduce(
    (newPourcentages, category) => ({
      ...newPourcentages,
      [category]: {
        menCount: ageRanges.reduce(
          (totalCategoryCount, ageRange) => totalCategoryCount + (funnelCsp[category].ageRanges[ageRange].men || 0),
          0,
        ),
        womenCount: ageRanges.reduce(
          (totalCategoryCount, ageRange) => totalCategoryCount + (funnelCsp[category].ageRanges[ageRange].women || 0),
          0,
        ),
        men: pourcentages?.[category]?.men ?? 0,
        women: pourcentages?.[category]?.women ?? 0,
      } as Percentages[CSP.Enum],
    }),
    {} as Percentages,
  );

export const getTotalsCsp = (funnel: CreateSimulationDTO): [totalCspWomen: number, totalCspMen: number] =>
  categories.reduce(
    (acc, category) =>
      ageRanges.reduce(
        (innerAcc, ageRange) => [
          innerAcc[0] + (funnel.effectifs.csp[category].ageRanges[ageRange].women || 0),
          innerAcc[1] + (funnel.effectifs.csp[category].ageRanges[ageRange].men || 0),
        ],
        acc,
      ),
    [0, 0],
  );
