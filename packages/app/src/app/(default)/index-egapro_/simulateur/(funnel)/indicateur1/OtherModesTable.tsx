import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import {
  ageRanges,
  categories,
  type IndicateurUnComputer,
  type RemunerationsCountAndAverageSalaries,
  type RemunerationsOther,
} from "@common/core-domain/computers/IndicateurUnComputer";
import { type RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { CSPAgeRange } from "@common/core-domain/domain/valueObjects/declaration/simulation/CSPAgeRange";
import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { type Any } from "@common/utils/types";
import { AlternativeTable, type AlternativeTableProps, CenteredContainer } from "@design-system";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { getCommonBodyColumns, getCommonFooter, getCommonHeader } from "./tableUtil";

type Indic1FormType = z.infer<typeof createSteps.indicateur1>;

interface OtherModesTableProps {
  computer: IndicateurUnComputer<
    RemunerationsMode.Enum.BRANCH_LEVEL | RemunerationsMode.Enum.OTHER_LEVEL,
    RemunerationsOther
  >;
  staff?: boolean;
}

const errorColor = "var(--text-default-error)";

export const OtherModesTable = ({ computer, staff }: OtherModesTableProps) => {
  const funnel = useSimuFunnelStore(state => state.funnel);
  const hydrated = useSimuFunnelStoreHasHydrated();

  const {
    register,
    formState: { errors },
    watch,
    control,
  } = useFormContext<Indic1FormType>();

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
  const { result } = computer.compute();

  const csp = funnel.effectifs.csp;
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
  const enoughWomen = metadata.totalWomenCount === totalCspWomen;
  const enoughMen = metadata.totalMenCount === totalCspMen;

  return (
    <>
      <AlternativeTable
        header={getCommonHeader({ firstColumnLabel: "Niveau ou coefficient hiérarchique" })}
        body={remunerationsFields.map<AlternativeTableProps.BodyContent>(
          (remunerationsField, remunerationsFieldIndex) => {
            const categoryId = remunerationsField.categoryId || remunerationsField.id;
            register(`remunerations.${remunerationsFieldIndex}.categoryId`, {
              value: categoryId,
              deps: `remunerations.${remunerationsFieldIndex}.name`,
            });

            return {
              key: remunerationsField.id,
              isDeletable: remunerationsFieldIndex > 0,
              onClickDelete: () => {
                removeRemunerations(remunerationsFieldIndex);
              },
              categoryLabel: (
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
                      const firstCols: [AlternativeTableProps.ColType, ...AlternativeTableProps.ColType[]] = [
                        {
                          label: `Nombre de salariés - ${remunerationsField.name} - ${ageRange} - Femmes`,
                          state:
                            (errors.remunerations?.[remunerationsFieldIndex]?.category?.[ageRange] as Any)
                              ?.womenCount && "error",
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
                      ];

                      const count = categoryContent[ageRange];

                      if (!count) {
                        return {
                          cols: [...firstCols, "-", "-", "-", "-"],
                        };
                      }

                      const womenCount = count.womenCount || 0;
                      const menCount = count.menCount || 0;

                      return getCommonBodyColumns({
                        ageRange,
                        categoryId,
                        categoryIndex: remunerationsFieldIndex,
                        categoryName: remunerationsField.name,
                        computer,
                        errors,
                        firstCols,
                        menCount,
                        womenCount,
                        register,
                      });
                    })(),
                  })) as [AlternativeTableProps.SubRow, ...AlternativeTableProps.SubRow[]],
                };
              })(),
            };
          },
        )}
        footer={getCommonFooter({
          computer,
          effectifsCsp: funnel.effectifs.csp,
        })}
      />

      <CenteredContainer fluid>
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
      </CenteredContainer>
    </>
  );
};
