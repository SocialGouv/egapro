import { ageRanges, categories, type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type CSPAgeRange } from "@common/core-domain/domain/valueObjects/declaration/simulation/CSPAgeRange";
import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { currencyFormat, percentFormat, precisePercentFormat } from "@common/utils/number";
import { type Any } from "@common/utils/types";
import { AideSimulationIndicateurUn } from "@components/aide-simulation/IndicateurUn";
import { type AlternativeTableProps } from "@design-system";
import { type FieldErrors, type UseFormRegister } from "react-hook-form";
import { type z } from "zod";

interface CommonHeaderProps {
  firstColumnLabel: string;
}

export const getCommonHeader = ({ firstColumnLabel }: CommonHeaderProps): AlternativeTableProps["header"] => [
  {
    label: firstColumnLabel,
  },
  {
    label: "Tranche d’âge",
  },
  {
    label: "Nombre de salariés",
    subCols: [
      {
        label: "Femmes",
      },
      {
        label: "Hommes",
      },
    ],
  },
  {
    label: "Effectifs valides",
    informations:
      "Ce sont les effectifs retenus pour le calcul de l’indicateur comportant au moins 3 femmes et 3 hommes.",
  },
  {
    label: "Rémunération annuelle brute moyenne en équivalent temps plein",
    informations: <AideSimulationIndicateurUn.Definition />,
    subCols: [
      {
        label: "Femmes",
      },
      {
        label: "Hommes",
      },
    ],
  },
  {
    label: "Écarts pondérés",
    informations: <AideSimulationIndicateurUn.CommentEstCalculéLIndicateur skipRemuDetails />,
  },
];

export type Indic1FormType = z.infer<typeof createSteps.indicateur1>;

interface CommonBodyColumnsProps {
  ageRange: CSPAgeRange.Enum;
  categoryId: string;
  categoryIndex: number;
  categoryName: string;
  computer: IndicateurUnComputer<Any, Any>;
  errors: FieldErrors<Indic1FormType>;
  firstCols: AlternativeTableProps.ColType[];
  menCount: number;
  register: UseFormRegister<Indic1FormType>;
  womenCount: number;
}
type CommonBodyColumnsReturn = Omit<NonNullable<AlternativeTableProps["body"][number]["subRows"]>[number], "label">;
type ColsType = [AlternativeTableProps.ColType, ...AlternativeTableProps.ColType[]];

export const getCommonBodyColumns = ({
  firstCols,
  womenCount = 0,
  menCount = 0,
  categoryName,
  categoryIndex,
  categoryId,
  ageRange,
  errors,
  computer,
  register,
}: CommonBodyColumnsProps): CommonBodyColumnsReturn => {
  const cols = firstCols as ColsType;
  if (womenCount < 3 && menCount < 3) {
    return {
      cols,
      mergedLabel: "Non pris en compte car moins de 3 femmes / hommes",
    };
  } else if (womenCount < 3) {
    return {
      cols,
      mergedLabel: "Non pris en compte car moins de 3 femmes",
    };
  } else if (menCount < 3) {
    return {
      cols,
      mergedLabel: "Non pris en compte car moins de 3 hommes",
    };
  }

  return {
    cols: [
      ...cols,
      womenCount + menCount,
      {
        label: `Remu moyenne - ${categoryName} - ${ageRange} - Femmes`,
        state: errors.remunerations?.[categoryIndex]?.category?.[ageRange]?.womenSalary && "error",
        stateRelatedMessage: errors.remunerations?.[categoryIndex]?.category?.[ageRange]?.womenSalary?.message,
        nativeInputProps: {
          type: "number",
          min: 0,
          ...register(`remunerations.${categoryIndex}.category.${ageRange}.womenSalary`, {
            valueAsNumber: true,
            deps: `remunerations.${categoryIndex}.category.${ageRange}.menSalary`,
          }),
        },
      },
      {
        label: `Remu moyenne - ${categoryName} - ${ageRange} - Hommes`,
        state: errors.remunerations?.[categoryIndex]?.category?.[ageRange]?.menSalary && "error",
        stateRelatedMessage: errors.remunerations?.[categoryIndex]?.category?.[ageRange]?.menSalary?.message,
        nativeInputProps: {
          type: "number",
          min: 0,
          ...register(`remunerations.${categoryIndex}.category.${ageRange}.menSalary`, {
            valueAsNumber: true,
            deps: `remunerations.${categoryIndex}.category.${ageRange}.womenSalary`,
          }),
        },
      },
      (() => {
        const { result: groupResult } = computer.computeGroup(categoryId, ageRange);
        return !Number.isNaN(groupResult) && Number.isFinite(groupResult)
          ? precisePercentFormat.format(groupResult / 100)
          : "-";
      })(),
    ],
  };
};

interface CommonFooterProps {
  computer: IndicateurUnComputer<Any, Any>;
  effectifsCsp: z.infer<typeof createSteps.effectifs>["csp"];
}
const errorColor = "var(--text-default-error)";
export const getCommonFooter = ({
  computer,
  effectifsCsp: csp,
}: CommonFooterProps): AlternativeTableProps["footer"] => {
  const [totalCspWomen, totalCspMen] = categories.reduce(
    (acc, category) =>
      ageRanges.reduce(
        (innerAcc, ageRange) => [
          innerAcc[0] + (csp[category].ageRanges[ageRange].women || 0),
          innerAcc[1] + (csp[category].ageRanges[ageRange].men || 0),
        ],
        acc,
      ),
    [0, 0],
  );
  const { result } = computer.compute();
  const metadata = computer.getTotalMetadata();
  const enoughWomen = metadata.totalWomenCount === totalCspWomen;
  const enoughMen = metadata.totalMenCount === totalCspMen;

  return [
    {
      label: "Ensemble des salariés",
      colspan: 2,
    },
    {
      label: (() => {
        const womenLabel = enoughWomen ? (
          `${metadata.totalWomenCount} femmes`
        ) : (
          <>
            <span style={{ color: errorColor }}>{metadata.totalWomenCount}</span> / {totalCspWomen} femmes
          </>
        );
        const menLabel = enoughMen ? (
          `${metadata.totalMenCount} hommes`
        ) : (
          <>
            <span style={{ color: errorColor }}>{metadata.totalMenCount}</span> / {totalCspMen} hommes
          </>
        );
        return (
          <>
            {womenLabel} - {menLabel}
          </>
        );
      })(),
      colspan: 2,
      data: (() => {
        const totalLabel =
          enoughWomen && enoughMen ? (
            `${metadata.totalEmployeeCount}`
          ) : (
            <>
              <span style={{ color: errorColor }}>{metadata.totalEmployeeCount}</span> / {totalCspWomen + totalCspMen}
            </>
          );
        return totalLabel;
      })(),
    },
    {
      label: "Effectifs valides",
      data: metadata.totalGroupCount,
    },
    {
      label: "Salaire moyen Femmes",
      data: currencyFormat.format(metadata.averageWomenSalary),
    },
    {
      label: "Salaire moyen Hommes",
      data: currencyFormat.format(metadata.averageMenSalary),
    },
    {
      label: "Écart global",
      data: percentFormat.format(result / 100),
    },
  ];
};
