import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { ageRanges, buildRemunerationKey, categories } from "@common/core-domain/computers/utils";
import { type AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { deleteEmptyStringOnPaste, setValueAsFloatOrEmptyString } from "@common/utils/form";
import { precisePercentFormat } from "@common/utils/number";
import { type AlternativeTableProps } from "@design-system";
import { type FieldErrors, type UseFormRegister } from "react-hook-form";
import { type z } from "zod";

interface CommonHeaderProps {
  firstColumnInformations?: React.ReactNode;
  firstColumnLabel: string;
}

export const getCommonHeader = ({
  firstColumnLabel,
  firstColumnInformations = undefined,
}: CommonHeaderProps): AlternativeTableProps["header"] => [
  {
    label: firstColumnLabel,
    informations: firstColumnInformations,
  },
  {
    label: "Tranche d’âge",
    informations:
      "Les caractéristiques individuelles (niveau ou coefficient hiérarchique, âge) sont appréciées au dernier jour de la période de référence annuelle considérée ou au dernier jour de présence du salarié dans l’entreprise.",
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
    informations: (
      <>
        <p>
          Il s'agit de l’effectif des salariés à prendre en compte pour le calcul des indicateurs, qui est apprécié en
          effectif physique sur la période de référence annuelle considérée.
        </p>
        <p>Ne sont pas pris en compte dans l’effectif :</p>
        <ul>
          <li>les apprentis,</li>
          <li>les titulaires d’un contrat de professionnalisation,</li>
          <li>
            les salariés mis à la disposition de l’entreprise par une entreprise extérieure (dont les intérimaires),
          </li>
          <li>les expatriés,</li>
          <li>les salariés en pré-retraite,</li>
          <li>
            les salariés absents plus de 6 mois sur la période de référence annuelle considérée (arrêt maladie, congés
            sans solde, CDD inférieur à 6 mois etc.).
          </li>
        </ul>
      </>
    ),
  },
  {
    label: "Effectifs valides",
    informations:
      "Ce sont les effectifs des groupes retenus pour le calcul de l’indicateur, c'est à dire comptant au moins 3 femmes et 3 hommes.",
  },
  {
    label: "Rémunération annuelle brute moyenne en équivalent temps plein *",
    informations: (
      <>
        <p>
          La rémunération moyenne des femmes et des hommes est calculée pour chacun des groupes pris en compte pour le
          calcul de l’indicateur, en calculant le salaire en équivalent temps plein sur la période de référence annuelle
          considérée pour chaque salarié puis en faisant la moyenne.
        </p>
        <p>Doivent être pris en compte dans la rémunération :</p>
        <ul>
          <li>
            les salaires ou traitements ordinaires de base ou minimum et tous les autres avantages et accessoires payés,
            directement ou indirectement, en espèces ou en nature, par l’employeur au salarié en raison de l’emploi de
            ce dernier,
          </li>
          <li>
            les "bonus", les commissions sur produits, les primes d’objectif liées aux performances individuelles du
            salarié, variables d’un individu à l’autre pour un même poste,
          </li>
          <li>les primes collectives (ex : les primes de transport ou primes de vacances),</li>
          <li>les indemnités de congés payés.</li>
        </ul>
        <br />
        <p>Ne doivent pas être pris en compte dans la rémunération :</p>
        <ul>
          <li>les indemnités de fin de CDD (notamment la prime de précarité),</li>
          <li>les sommes versées dans le cadre du compte épargne-temps (CET)</li>
          <li>les actions, stock-options, compensations différées en actions,</li>
          <li>
            les primes liées à une sujétion particulière qui ne concernent pas la personne du salarié (prime de froid,
            prime de nuit etc.),
          </li>
          <li>les heures supplémentaires et complémentaires,</li>
          <li>les indemnités de licenciement,</li>
          <li>les indemnités de départ en retraite,</li>
          <li>les primes d’ancienneté,</li>
          <li>les primes d’intéressement et de participation.</li>
        </ul>
      </>
    ),
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
    label: "Écart pondéré",
    informations: (
      <>
        <p>
          L’écart de rémunération est calculé, en pourcentage, pour chacun des groupes, en soustrayant la rémunération
          moyenne des femmes à la rémunération moyenne des hommes et en rapportant ce résultat à la rémunération moyenne
          des hommes.
        </p>

        <p>
          Dans les groupes constitués par catégorie socio-professionnelle, le seuil de pertinence des écarts est de 5%.
          Dans les groupes constitués par niveau ou coefficient hiérarchique, le seuil de pertinence des écarts est de
          2%. Lorsque l’écart de rémunération est positif, le seuil de pertinence est déduit de l’écart, sans toutefois
          pouvoir l’amener à devenir négatif (plancher à zéro). Lorsque l’écart de rémunération est négatif, le seuil de
          pertinence est ajouté à l’écart, sans toutefois pouvoir l’amener à devenir positif (plafond à zéro).
        </p>

        <p>
          Les écarts ainsi ajustés en fonction des seuils pour chacun des groupes, sont multipliés par le ratio de
          l’effectif du groupe à l’effectif total des groupes pris en compte, puis additionnés pour obtenir l’écart
          global de rémunération entre les femmes et les hommes.
        </p>
      </>
    ),
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
      label: "Écart global",
      data: precisePercentFormat.format(resultRaw / 100),
    },
  ];
};
