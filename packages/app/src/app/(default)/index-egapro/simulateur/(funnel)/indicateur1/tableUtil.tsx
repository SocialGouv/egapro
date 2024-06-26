import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { ageRanges, buildRemunerationKey, categories } from "@common/core-domain/computers/utils";
import { type AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { deleteEmptyStringOnPaste, setValueAsFloatOrEmptyString } from "@common/utils/form";
import { precisePercentFormat } from "@common/utils/number";
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
    label: "Nombre de salariés (en effectif physique) *",
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
    label: "Rémunération annuelle brute moyenne en équivalent temps plein *",
    informations: <AideSimulationIndicateurUn.Définition />,
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
  ageRange: AgeRange.Enum;
  categoryIndex: number;
  categoryName: string;
  computer: IndicateurUnComputer;
  errors: FieldErrors<Indic1FormType>;
  firstCols: AlternativeTableProps.ColType[];
  hasCountNotFilled: boolean;
  menCount: number;
  mode: RemunerationsMode.Enum;
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
  ageRange,
  errors,
  computer,
  register,
  hasCountNotFilled,
  mode = RemunerationsMode.Enum.CSP,
}: CommonBodyColumnsProps): CommonBodyColumnsReturn => {
  const cols = firstCols as ColsType;

  if (hasCountNotFilled) {
    return {
      cols,
      mergedLabel: " ",
    };
  }
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
          onPaste: deleteEmptyStringOnPaste,
          ...register(`remunerations.${categoryIndex}.category.${ageRange}.womenSalary`, {
            setValueAs: setValueAsFloatOrEmptyString,
            deps: `remunerations.${categoryIndex}.category.${ageRange}.menSalary`,
          }),
          id: `remunerations.${categoryIndex}.category.${ageRange}.womenSalary`,
        },
      },
      {
        label: `Remu moyenne - ${categoryName} - ${ageRange} - Hommes`,
        state: errors.remunerations?.[categoryIndex]?.category?.[ageRange]?.menSalary && "error",
        stateRelatedMessage: errors.remunerations?.[categoryIndex]?.category?.[ageRange]?.menSalary?.message,
        nativeInputProps: {
          type: "number",
          min: 0,
          onPaste: deleteEmptyStringOnPaste,
          ...register(`remunerations.${categoryIndex}.category.${ageRange}.menSalary`, {
            setValueAs: setValueAsFloatOrEmptyString,
            deps: `remunerations.${categoryIndex}.category.${ageRange}.womenSalary`,
          }),
          id: `remunerations.${categoryIndex}.category.${ageRange}.menSalary`,
        },
      },
      (() => {
        const { resultRaw: groupResult } = computer.computeGroup(
          buildRemunerationKey(mode === RemunerationsMode.Enum.CSP ? categoryName : categoryIndex.toString(), ageRange),
        );
        return !Number.isNaN(groupResult) && Number.isFinite(groupResult)
          ? precisePercentFormat.format(groupResult / 100)
          : "-";
      })(),
    ],
  };
};

interface IsEnoughEmployeesProps {
  computer: IndicateurUnComputer;
  effectifsCsp: z.infer<typeof createSteps.effectifs>["csp"];
}
interface IsEnoughEmployeesReturn {
  enoughMen: boolean;
  enoughWomen: boolean;
  totalCspMen: number;
  totalCspWomen: number;
}
export const getIsEnoughEmployees = ({
  effectifsCsp: csp,
  computer,
}: IsEnoughEmployeesProps): IsEnoughEmployeesReturn => {
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

  const metadata = computer.getTotalMetadata();
  const enoughWomen = metadata.totalWomenCount === totalCspWomen;
  const enoughMen = metadata.totalMenCount === totalCspMen;

  return { enoughWomen, enoughMen, totalCspWomen, totalCspMen };
};

interface CommonFooterProps {
  computer: IndicateurUnComputer;
  effectifsCsp: z.infer<typeof createSteps.effectifs>["csp"];
}
export const getCommonFooter = ({ computer, effectifsCsp }: CommonFooterProps): AlternativeTableProps["footer"] => {
  const { resultRaw } = computer.compute();
  const metadata = computer.getTotalMetadata();
  const { enoughWomen, enoughMen, totalCspWomen, totalCspMen } = getIsEnoughEmployees({
    computer,
    effectifsCsp,
  });

  return [
    {
      label: "",
      colspan: 2,
    },
    {
      label: (() => {
        const womenLabel = enoughWomen ? (
          `${metadata.totalWomenCount} femmes`
        ) : (
          <>
            <span className="text-dsfr-error">{metadata.totalWomenCount}</span> / {totalCspWomen} femmes
          </>
        );
        const menLabel = enoughMen ? (
          `${metadata.totalMenCount} hommes`
        ) : (
          <>
            <span className="text-dsfr-error">{metadata.totalMenCount}</span> / {totalCspMen} hommes
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
            `${metadata.totalEmployeeCount} salarié${metadata.totalEmployeeCount > 1 ? "s" : ""}`
          ) : (
            <>
              <span className="text-dsfr-error">{metadata.totalEmployeeCount}</span> / {totalCspWomen + totalCspMen}{" "}
              salarié
              {metadata.totalEmployeeCount > 1 ? "s" : ""}
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
      label: "",
      colspan: 2,
    },
    {
      label: "Écart total",
      data: precisePercentFormat.format(resultRaw / 100),
    },
  ];
};
