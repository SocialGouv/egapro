import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  ageRanges,
  categories,
  type IndicateurUnComputer,
  type RemunerationsCSP,
} from "@common/core-domain/computers/indicateurUn";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { type RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { CSPAgeRange } from "@common/core-domain/domain/valueObjects/declaration/simulation/CSPAgeRange";
import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";
import { AideSimulationIndicateurUn } from "@components/aide-simulation/IndicateurUn";
import { AlternativeTable, type AlternativeTableProps, CenteredContainer, IndicatorNote } from "@design-system";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";

type Indic1FormType = z.infer<typeof createSteps.indicateur1>;

interface CSPModeTableProps {
  computer: IndicateurUnComputer<RemunerationsMode.Enum.CSP, RemunerationsCSP>;
}

const currencyFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export const CSPModeTable = ({ computer }: CSPModeTableProps) => {
  const funnel = useSimuFunnelStore(state => state.funnel);
  const hydrated = useSimuFunnelStoreHasHydrated();

  const {
    register,
    formState: { errors, isValid },
    watch,
  } = useFormContext<Indic1FormType>();

  if (!hydrated || !funnel?.effectifs) {
    return null;
  }

  const remunerations = watch("remunerations");

  const remuWithCount = Object.keys(funnel.effectifs.csp).reduce(
    (newEmployees, category) => ({
      ...newEmployees,
      [category]: ageRanges.reduce(
        (newAgeGroups, ageRange) => ({
          ...newAgeGroups,
          [ageRange]: {
            womenSalary: remunerations?.[category]?.[ageRange]?.womenSalary ?? 0,
            menSalary: remunerations?.[category]?.[ageRange]?.menSalary ?? 0,
            womenCount: funnel.effectifs!.csp[category].ageRanges[ageRange].women,
            menCount: funnel.effectifs!.csp[category].ageRanges[ageRange].men,
          },
        }),
        {},
      ),
    }),
    {} as RemunerationsCSP,
  );

  computer.setRemunerations(remuWithCount);

  const canCompute = computer.canCompute();

  if (remunerations && !canCompute) {
    return (
      <CenteredContainer fluid>
        <Alert
          className="fr-mb-3w"
          severity="warning"
          title="L'indicateur n'est pas calculable par CSP"
          description="L’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs."
        />
      </CenteredContainer>
    );
  }

  const metadata = computer.getTotalMetadata();
  const { result, note, genderAdvantage } = computer.compute();

  return (
    <>
      <AlternativeTable
        header={[
          {
            label: "Catégorie socio-professionnelle",
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
        ]}
        body={categories.map(category => ({
          categoryLabel: CSP.Label[category],
          ...(() => {
            const categoryContent = funnel?.effectifs?.csp[category];
            if (!categoryContent) {
              return {
                mergedLabel: "Pas de données",
              };
            }

            const totalCategory = [...Object.values(categoryContent.ageRanges)].reduce(
              (acc, ageRange) => acc + ageRange.women + ageRange.men,
              0,
            );

            if (!totalCategory) {
              return {
                mergedLabel: "Aucun effectif pris en compte renseigné",
              };
            }

            return {
              subRows: ageRanges.map<AlternativeTableProps.SubRow>(ageRange => ({
                label: CSPAgeRange.Label[ageRange],
                ...(() => {
                  const csp = funnel?.effectifs?.csp[category].ageRanges[ageRange];
                  if (!csp) {
                    return {
                      mergedLabel: "Calcul en cours",
                    };
                  }

                  const cols = [csp.women || "-", csp.men || "-"] as [
                    AlternativeTableProps.ColType,
                    ...AlternativeTableProps.ColType[],
                  ];
                  if (csp.women < 3 && csp.men < 3) {
                    return {
                      cols,
                      mergedLabel: "Non pris en compte car moins de 3 femmes / hommes",
                    };
                  } else if (csp.women < 3) {
                    return {
                      cols,
                      mergedLabel: "Non pris en compte car moins de 3 femmes",
                    };
                  } else if (csp.men < 3) {
                    return {
                      cols,
                      mergedLabel: "Non pris en compte car moins de 3 hommes",
                    };
                  }

                  return {
                    cols: [
                      ...cols,
                      csp.women + csp.men,
                      {
                        label: `Remu moyenne - ${category} - ${ageRange} - Femmes`,
                        state: errors.remunerations?.[category]?.[ageRange]?.womenSalary && "error",
                        stateRelatedMessage: errors.remunerations?.[category]?.[ageRange]?.womenSalary?.message,
                        nativeInputProps: {
                          type: "number",
                          min: 0,
                          ...register(`remunerations.${category}.${ageRange}.womenSalary`, {
                            valueAsNumber: true,
                            deps: `remunerations.${category}.${ageRange}.menSalary`,
                          }),
                        },
                      },
                      {
                        label: `Remu moyenne - ${category} - ${ageRange} - Hommes`,
                        state: errors.remunerations?.[category]?.[ageRange]?.menSalary && "error",
                        stateRelatedMessage: errors.remunerations?.[category]?.[ageRange]?.menSalary?.message,
                        nativeInputProps: {
                          type: "number",
                          min: 0,
                          ...register(`remunerations.${category}.${ageRange}.menSalary`, {
                            valueAsNumber: true,
                            deps: `remunerations.${category}.${ageRange}.womenSalary`,
                          }),
                        },
                      },
                      (() => {
                        const { result: groupResult } = computer.computeGroup(category, ageRange);
                        return !Number.isNaN(groupResult) && Number.isFinite(groupResult)
                          ? percentFormat.format(groupResult / 100)
                          : "-";
                      })(),
                    ],
                  };
                })(),
              })) as [AlternativeTableProps.SubRow, ...AlternativeTableProps.SubRow[]],
            };
          })(),
        }))}
        footer={[
          {
            label: "Ensemble des salariés",
            colspan: 2,
          },
          {
            label: `${metadata.totalWomenCount} femmes - ${metadata.totalMenCount} hommes`,
            colspan: 2,
            data: metadata.totalEmployeeCount,
          },
          {
            label: "Effectifs valides",
            data: metadata.totalGroupCount,
          },
          {
            label: "Salaire total Femmes",
            data: currencyFormat.format(metadata.totalWomenSalary),
          },
          {
            label: "Salaire total Hommes",
            data: currencyFormat.format(metadata.totalMenSalary),
          },
          {
            label: "Écart global",
            data: isValid ? percentFormat.format(result / 100) : "-",
          },
        ]}
      />

      <CenteredContainer fluid mb="4w" py="1w">
        {isValid ? (
          <IndicatorNote
            note={note}
            max={40}
            text="Nombre de points obtenus à l'indicateur"
            legend={
              note === 40
                ? "Les femmes et les hommes sont à égalité"
                : `Écart en faveur des ${genderAdvantage === "women" ? "femmes" : "hommes"}`
            }
          />
        ) : (
          <IndicatorNote
            note="-"
            max={40}
            text="Nombre de points obtenus à l'indicateur"
            legend="Veuillez remplir le reste des rémunérations pour avoir votre note"
          />
        )}
      </CenteredContainer>
    </>
  );
};
