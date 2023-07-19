import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import {
  ageRanges,
  type IndicateurUnComputer,
  type RemunerationsCountAndAverageSalaries,
  type RemunerationsOther,
} from "@common/core-domain/computers/indicateurUn";
import { type RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { CSPAgeRange } from "@common/core-domain/domain/valueObjects/declaration/simulation/CSPAgeRange";
import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { type Any } from "@common/utils/types";
import { AideSimulationIndicateurUn } from "@components/aide-simulation/IndicateurUn";
import { ReactHookFormDebug } from "@components/RHF/ReactHookFormDebug";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { AlternativeTable, type AlternativeTableProps, CenteredContainer, IndicatorNote } from "@design-system";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";

type Indic1FormType = z.infer<typeof createSteps.indicateur1>;

interface OtherModesTableProps {
  computer: IndicateurUnComputer<
    RemunerationsMode.Enum.BRANCH_LEVEL | RemunerationsMode.Enum.OTHER_LEVEL,
    RemunerationsOther
  >;
  staff?: boolean;
}

const currencyFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export const OtherModesTable = ({ computer, staff }: OtherModesTableProps) => {
  const funnel = useSimuFunnelStore(state => state.funnel);
  const hydrated = useSimuFunnelStoreHasHydrated();

  const { register, formState, watch, control, setValue, getValues, setFocus } = useFormContext<Indic1FormType>();

  const { errors, isValid } = formState;

  const {
    fields: remunerationsFields,
    append: appendRemunerations,
    remove: removeRemunerations,
  } = useFieldArray({
    control,
    name: "remunerations",
  });

  if (!hydrated || !funnel?.effectifs) {
    return null;
  }

  const remunerations = watch("remunerations") as RemunerationsOther;

  computer.setRemunerations(remunerations);

  const metadata = computer.getTotalMetadata();
  const { result, note, genderAdvantage } = computer.compute();

  return (
    <>
      <AlternativeTable
        header={[
          {
            label: "Niveau ou coefficient hiérarchique",
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
        body={remunerationsFields.map<AlternativeTableProps.BodyContent>(
          (remunerationsField, remunerationsFieldIndex) => ({
            key: remunerationsField.id,
            isDeletable: remunerationsFieldIndex > 0,
            onClickDelete: () => {
              removeRemunerations(remunerationsFieldIndex);
            },
            categoryLabel: (
              <>
                <input
                  type="hidden"
                  {...register(`remunerations.${remunerationsFieldIndex}.id`)}
                  defaultValue={remunerationsField.id}
                />
                <Input
                  label="Niveau ou coefficient hiérarchique"
                  hideLabel
                  classes={{ message: "fr-sr-only" }}
                  state={errors.remunerations?.[remunerationsFieldIndex]?.name && "error"}
                  stateRelatedMessage={errors.remunerations?.[remunerationsFieldIndex]?.name?.message}
                  nativeInputProps={{
                    ...register(`remunerations.${remunerationsFieldIndex}.name`),
                  }}
                />
              </>
            ),
            ...(() => {
              const categoryContent = remunerationsField.category as Record<
                CSPAgeRange.Enum,
                RemunerationsCountAndAverageSalaries
              >;

              return {
                subRows: ageRanges.map<AlternativeTableProps.SubRow>(ageRange => ({
                  label: CSPAgeRange.Label[ageRange],
                  ...(() => {
                    const cols = [
                      {
                        label: `Nombre de salariés - ${remunerationsField.name} - ${ageRange} - Femmes`,
                        state:
                          (errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange] as Any)?.womenCount &&
                          "error",
                        stateRelatedMessage: (
                          errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange] as Any
                        )?.womenCount?.message,
                        nativeInputProps: {
                          ...register(`remunerations.${remunerationsFieldIndex}.category.${ageRange}.womenCount`, {
                            setValueAs: (value: string) => parseInt(value, 10) || 0,
                            deps: `remunerations.${remunerationsFieldIndex}.category.${ageRange}.menCount`,
                          }),
                          type: "number",
                          min: 0,
                        },
                      },
                      {
                        label: `Nombre de salariés - ${remunerationsField.name} - ${ageRange} - Hommes`,
                        state:
                          (errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange] as Any)?.menCount &&
                          "error",
                        stateRelatedMessage: (
                          errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange] as Any
                        )?.menCount?.message,
                        nativeInputProps: {
                          ...register(`remunerations.${remunerationsFieldIndex}.category.${ageRange}.menCount`, {
                            setValueAs: (value: string) => parseInt(value, 10) || 0,
                            deps: `remunerations.${remunerationsFieldIndex}.category.${ageRange}.womenCount`,
                          }),
                          type: "number",
                          min: 0,
                        },
                      },
                    ] as [AlternativeTableProps.ColType, ...AlternativeTableProps.ColType[]];

                    const count = categoryContent[ageRange];

                    if (!count) {
                      return {
                        cols: [...cols, "-", "-", "-", "-"],
                      };
                    }

                    const womenCount = count.womenCount || 0;
                    const menCount = count.menCount || 0;
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
                        count.womenCount + count.menCount,
                        {
                          label: `Remu moyenne - ${remunerationsField.name} - ${ageRange} - Femmes`,
                          state:
                            errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange]?.womenSalary &&
                            "error",
                          stateRelatedMessage:
                            errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange]?.womenSalary?.message,
                          nativeInputProps: {
                            type: "number",
                            min: 0,
                            ...register(`remunerations.${remunerationsFieldIndex}.category.${ageRange}.womenSalary`, {
                              valueAsNumber: true,
                              deps: `remunerations.${remunerationsFieldIndex}.category.${ageRange}.menSalary`,
                            }),
                          },
                        },
                        {
                          label: `Remu moyenne - ${remunerationsField.name} - ${ageRange} - Hommes`,
                          state:
                            errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange]?.menSalary && "error",
                          stateRelatedMessage:
                            errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange]?.menSalary?.message,
                          nativeInputProps: {
                            type: "number",
                            min: 0,
                            ...register(`remunerations.${remunerationsFieldIndex}.category.${ageRange}.menSalary`, {
                              valueAsNumber: true,
                              deps: `remunerations.${remunerationsFieldIndex}.category.${ageRange}.womenSalary`,
                            }),
                          },
                        },
                        (() => {
                          const { result: groupResult } = computer.computeGroup(remunerationsField.id, ageRange);
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
          }),
        )}
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
        ]}
      />

      <CenteredContainer fluid mb="4w" py="1w">
        <ButtonsGroup
          alignment="center"
          buttons={[
            {
              type: "button",
              children: "Ajouter un niveau ou coefficient hiérarchique",
              onClick: () => {
                appendRemunerations({ name: "", category: {} } as RemunerationsOther[number], {
                  shouldFocus: true,
                  focusName: `remunerations.${remunerationsFields.length}.name`,
                });
              },
              priority: "secondary",
              iconId: "fr-icon-add-line",
            },
          ]}
        />
        {JSON.stringify(formState)}
        <div>
          <DebugButton obj={errors} alwaysOn infoText="Form Errors" /> Form Errors
        </div>
        <div>
          <DebugButton obj={getValues()} alwaysOn infoText="Form Values" /> Form Values
        </div>
        <div>
          <DebugButton obj={computer} alwaysOn infoText="Computer" /> Computer
        </div>
        <ReactHookFormDebug formState={formState} />
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
