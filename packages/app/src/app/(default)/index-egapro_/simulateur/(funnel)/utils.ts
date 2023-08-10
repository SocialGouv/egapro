import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import {
  ageRanges,
  categories,
  type ExternalRemunerations,
  flattenRemunerations,
} from "@common/core-domain/computers/utils";
import { type CreateSimulationDTO } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";

export const getResultIndicateurUn = (funnel: CreateSimulationDTO) => {
  const computerIndicateurUn = new IndicateurUnComputer(funnel.indicateur1.mode);
  const remuWithCount = Object.keys(funnel.effectifs.csp).map<ExternalRemunerations[number]>(categoryName => ({
    name: categoryName,
    categoryId: categoryName,
    category: ageRanges.reduce(
      (newAgeGroups, ageRange) => {
        const remunerations = funnel.indicateur1!.remunerations as ExternalRemunerations;
        const effectifs = funnel.effectifs!;
        const currentAgeRange = remunerations.find(rem => rem?.name === categoryName)?.category?.[ageRange];
        return {
          ...newAgeGroups,
          [ageRange]: {
            womenSalary: currentAgeRange?.womenSalary ?? 0,
            menSalary: currentAgeRange?.menSalary ?? 0,
            womenCount: currentAgeRange?.womenCount ?? effectifs.csp[categoryName].ageRanges[ageRange].women,
            menCount: currentAgeRange?.menCount ?? effectifs.csp[categoryName].ageRanges[ageRange].men,
          },
        };
      },
      {} as ExternalRemunerations[number]["category"],
    ),
  }));
  computerIndicateurUn.setInput(flattenRemunerations(remuWithCount));

  return computerIndicateurUn.compute();
};

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
