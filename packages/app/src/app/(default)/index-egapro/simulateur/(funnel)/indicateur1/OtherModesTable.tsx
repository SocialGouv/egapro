import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import {
  type CountAndAverageSalaries,
  type IndicateurUnComputer,
} from "@common/core-domain/computers/IndicateurUnComputer";
import {
  ageRanges,
  type ExternalRemunerations,
  flattenHierarchicalLevelsRemunerations,
} from "@common/core-domain/computers/utils";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { deleteEmptyStringOnPaste, setValueAsFloatOrEmptyString } from "@common/utils/form";
import { type Any } from "@common/utils/types";
import { TooltipWrapper } from "@components/utils/TooltipWrapper";
import { AlternativeTable, type AlternativeTableProps, CenteredContainer } from "@design-system";
import { isUndefined } from "lodash";
import { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { Indicateur1Note } from "./Indicateur1Note";
import { getCommonBodyColumns, getCommonFooter, getCommonHeader } from "./tableUtil";

type Indic1FormType = z.infer<typeof createSteps.indicateur1>;

interface OtherModesTableProps {
  computer: IndicateurUnComputer;
  defaultRemunerations?: ExternalRemunerations;
}

export const OtherModesTable = ({ computer, defaultRemunerations }: OtherModesTableProps) => {
  const funnel = useSimuFunnelStore(state => state.funnel);
  const hydrated = useSimuFunnelStoreHasHydrated();

  const {
    register,
    formState: { errors, isValid },
    watch,
    control,
  } = useFormContext<Indic1FormType>();

  const {
    fields: remunerationsFields,
    append: appendRemunerations,
    remove: removeRemunerations,
    replace: replaceRemunerations,
  } = useFieldArray({
    control,
    name: "remunerations",
  });

  useEffect(() => {
    if (defaultRemunerations) {
      replaceRemunerations(defaultRemunerations);
    }
  }, [defaultRemunerations, replaceRemunerations]);

  if (!hydrated || !funnel?.effectifs) {
    return null;
  }

  const remunerations = watch("remunerations") as ExternalRemunerations;

  computer.setInput(flattenHierarchicalLevelsRemunerations(remunerations));
  computer.compute();

  return (
    <>
      <AlternativeTable
        withTooltip
        classeName={fr.cx("fr-mb-1w")}
        header={[
          ...getCommonHeader({
            firstColumnLabel: "Niveau ou coefficient hiérarchique *",
            firstColumnInformations:
              "Les caractéristiques individuelles (niveau ou coefficient hiérarchique, âge) sont appréciées au dernier jour de la période de référence annuelle considérée ou au dernier jour de présence du salarié dans l’entreprise.",
            extraColumn: [
              {
                label: "Tranche d’âge",
                informations:
                  "Les caractéristiques individuelles (niveau ou coefficient hiérarchique, âge) sont appréciées au dernier jour de la période de référence annuelle considérée ou au dernier jour de présence du salarié dans l’entreprise.",
              },
              {
                label: "Nombre de salariés (en effectif physique)*",
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
                      Il s'agit de l’effectif des salariés à prendre en compte pour le calcul des indicateurs, qui est
                      apprécié en effectif physique sur la période de référence annuelle considérée.
                    </p>
                    <p>Ne sont pas pris en compte dans l’effectif :</p>
                    <ul>
                      <li>les apprentis,</li>
                      <li>les titulaires d’un contrat de professionnalisation,</li>
                      <li>
                        les salariés mis à la disposition de l’entreprise par une entreprise extérieure (dont les
                        intérimaires),
                      </li>
                      <li>les expatriés,</li>
                      <li>les salariés en pré-retraite,</li>
                      <li>
                        les salariés absents plus de 6 mois sur la période de référence annuelle considérée (arrêt
                        maladie, congés sans solde, CDD inférieur à 6 mois etc.).
                      </li>
                    </ul>
                  </>
                ),
              },
            ],
          }),
        ]}
        body={remunerationsFields.map<AlternativeTableProps.BodyContent>(
          (remunerationsField, remunerationsFieldIndex) => {
            return {
              key: remunerationsField.id,
              isDeletable: remunerationsFieldIndex > 0,
              onClickDelete: () => {
                removeRemunerations(remunerationsFieldIndex);
              },
              categoryLabel: (
                <TooltipWrapper message={errors.remunerations?.[remunerationsFieldIndex]?.name?.message}>
                  <Input
                    label="Niveau ou coefficient hiérarchique"
                    hideLabel
                    classes={{ message: "fr-sr-only" }}
                    state={errors.remunerations?.[remunerationsFieldIndex]?.name && "error"}
                    stateRelatedMessage={errors.remunerations?.[remunerationsFieldIndex]?.name?.message}
                    nativeInputProps={{
                      ...register(`remunerations.${remunerationsFieldIndex}.name`),
                      id: `remunerations.${remunerationsFieldIndex}.name`,
                    }}
                  />
                </TooltipWrapper>
              ),
              ...(() => {
                const categoryContent = remunerationsField.category as Record<AgeRange.Enum, CountAndAverageSalaries>;

                return {
                  subRows: ageRanges.map<AlternativeTableProps.SubRow>(ageRange => ({
                    label: AgeRange.Label[ageRange],
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
                            onPaste: deleteEmptyStringOnPaste,
                            ...register(`remunerations.${remunerationsFieldIndex}.category.${ageRange}.womenCount`, {
                              setValueAs: setValueAsFloatOrEmptyString,
                              deps: `remunerations.${remunerationsFieldIndex}.category.${ageRange}.menCount`,
                            }),
                            id: `remunerations.${remunerationsFieldIndex}.category.${ageRange}.womenCount`,
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
                            onPaste: deleteEmptyStringOnPaste,
                            ...register(`remunerations.${remunerationsFieldIndex}.category.${ageRange}.menCount`, {
                              setValueAs: setValueAsFloatOrEmptyString,
                              deps: `remunerations.${remunerationsFieldIndex}.category.${ageRange}.womenCount`,
                            }),
                            id: `remunerations.${remunerationsFieldIndex}.category.${ageRange}.menCount`,
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

                      const hasCountNotFilled =
                        ((count.menCount as number | string) == "" && (count.womenCount as number | string) == "") ||
                        (isUndefined(count.menCount) && isUndefined(count.womenCount));
                      const womenCount = count.womenCount || 0;
                      const menCount = count.menCount || 0;

                      return getCommonBodyColumns({
                        ageRange,
                        categoryIndex: remunerationsFieldIndex,
                        categoryName: remunerationsField.name,
                        mode: RemunerationsMode.Enum.OTHER_LEVEL,
                        computer,
                        errors,
                        firstCols,
                        menCount,
                        womenCount,
                        register,
                        hasCountNotFilled,
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

      <Button
        size="small"
        type="button"
        priority="secondary"
        iconId="fr-icon-add-line"
        className={fr.cx("fr-mb-4w")}
        id={`add-hierarchical-level`}
        onClick={() => {
          appendRemunerations({ name: "", category: {} } as ExternalRemunerations[number], {
            shouldFocus: true,
            focusName: `remunerations.${remunerationsFields.length}.name`,
          });
        }}
      >
        Ajouter un niveau ou coefficient hiérarchique
      </Button>

      <CenteredContainer fluid py="1w">
        <Indicateur1Note computer={computer} isValid={isValid} />
      </CenteredContainer>
    </>
  );
};
