"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type ComputedResult } from "@common/core-domain/computers/AbstractComputer";
import { IndicateurDeuxComputer, type Percentages } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { categories } from "@common/core-domain/computers/utils";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import {
  type CreateSimulationDTO,
  type CreateSimulationWorkforceRangeMoreThan250DTO,
  createSteps,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { precisePercentFormat } from "@common/utils/number";
import { zodFr } from "@common/utils/zod";
import { storePicker } from "@common/utils/zustand";
import { AideSimulationIndicateurDeux } from "@components/aide-simulation/IndicateurDeux";
import { AideSimulationIndicateurTrois } from "@components/aide-simulation/IndicateurTrois";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { AlternativeTable, type AlternativeTableProps, BackNextButtonsGroup, Box, FormLayout } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { isEmpty } from "lodash";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { getPourcentagesAugmentationPromotionsWithCount, prepareIndicateurUnComputer } from "../utils";
import { Indicateur2ou3Note } from "./Indicateur2ou3Note";

type Indic2or3FormType = z.infer<typeof createSteps.indicateur2>;
type Indic2or3FormTypeWhenCalculable = Extract<Indic2or3FormType, { calculable: true }>;

const indicateur1Computer = new IndicateurUnComputer();
const indicateur2Computer = new IndicateurDeuxComputer(indicateur1Computer);
const indicateur3Computer = new IndicateurTroisComputer(indicateur1Computer);

interface Indic2or3FormProps {
  indicateur: 2 | 3;
}

const schemaWithGlobalPourcentageVerification = (indicateur: Indic2or3FormProps["indicateur"]) =>
  createSteps.indicateur3.superRefine((obj, ctx) => {
    const totalPourcentages = Object.values(obj.pourcentages ?? {}).reduce(
      (prev, current) => current.women + current.men + prev,
      0,
    );

    if (obj.calculable && !isEmpty(obj.pourcentages) && totalPourcentages === 0) {
      const errorMessage =
        "Tous les champs ne peuvent être à 0 s'il y a eu des " + (indicateur === 2 ? "augmentations" : "promotions");
      ctx.addIssue({
        code: zodFr.ZodIssueCode.custom,
        message: errorMessage,
        path: ["root.totalPourcentages"],
      });
    }
  });

const useStore = storePicker(useSimuFunnelStore);

export const Indic2or3Form = ({ indicateur }: Indic2or3FormProps) => {
  const router = useRouter();
  const [_funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const hydrated = useSimuFunnelStoreHasHydrated();
  const [lastPourcentages, setLastPourcentages] = useState<Indic2or3FormTypeWhenCalculable["pourcentages"]>();

  const funnel = _funnel as Partial<CreateSimulationWorkforceRangeMoreThan250DTO> | undefined;
  const computer = indicateur === 2 ? indicateur2Computer : indicateur3Computer;
  const indicateurNav = indicateur === 2 ? NAVIGATION.indicateur2 : NAVIGATION.indicateur3;
  const AideSimulationIndicateurDeuxOurTrois =
    indicateur === 2 ? AideSimulationIndicateurDeux : AideSimulationIndicateurTrois;

  const methods = useForm<Indic2or3FormType>({
    mode: "onChange",
    resolver: zodResolver(schemaWithGlobalPourcentageVerification(indicateur)),
    defaultValues: funnel?.[`indicateur${indicateur}`],
  });

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    watch,
    getValues,
    reset,
    trigger,
    control,
  } = methods;

  if (!hydrated) {
    return <SkeletonForm fields={2} />;
  }

  if (!funnel?.effectifs) {
    redirect(simulateurPath("effectifs"));
  }

  if (!funnel.indicateur1) {
    redirect(simulateurPath("indicateur1"));
  }

  if (_funnel?.effectifs?.workforceRange === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
    redirect(simulateurPath("indicateur2et3"));
  }

  prepareIndicateurUnComputer(indicateur1Computer, funnel as CreateSimulationDTO);

  const computableCheck = watch("calculable");
  const pourcentages = watch("pourcentages");

  // add count from "funnel.effectifs.csp" to pourcentages, to make pourcentagesWithCount
  const pourcentagesWithCount = getPourcentagesAugmentationPromotionsWithCount(
    funnel.effectifs.csp,
    pourcentages as Percentages,
  );

  computer.setInput(pourcentagesWithCount);

  let result = {} as ComputedResult;

  const canCompute = computer.canCompute();
  if (canCompute) {
    result = computer.compute();
  } else {
    register("calculable", { value: false });
  }

  const onSubmit = async (indicateur2or3: Indic2or3FormType) => {
    saveFunnel({ [`indicateur${indicateur}`]: indicateur2or3 });
    router.push(simulateurPath(indicateurNav.next()));
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <ClientAnimate>
          {!canCompute ? (
            <Alert
              className="fr-mb-3w"
              severity="warning"
              title="L'indicateur n'est pas calculable"
              description="L’ensemble des groupes valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
            />
          ) : (
            <>
              <FormLayout>
                <Controller
                  control={control}
                  name="calculable"
                  render={({ field, fieldState }) => (
                    <RadioButtons
                      orientation="horizontal"
                      legend={
                        indicateur === 2
                          ? "Y a-t-il eu des augmentations individuelles (hors promotions) durant la période de référence ?"
                          : "Y a-t-il eu des promotions durant la période de référence ?"
                      }
                      hintText={
                        indicateur === 2 &&
                        "Il s'agit des augmentations individuelles du salaire de base, en excluant celles liées à une promotion."
                      }
                      state={fieldState.error && "error"}
                      stateRelatedMessage={fieldState.error?.message}
                      options={[
                        {
                          label: "Oui",
                          nativeInputProps: {
                            ...field,
                            value: 1,
                            defaultChecked: field.value === true,
                            onChange() {
                              reset({
                                calculable: true,
                                pourcentages: lastPourcentages,
                              });
                              trigger("pourcentages");
                              setLastPourcentages(void 0);
                              field.onChange(true);
                            },
                          },
                        },
                        {
                          label: "Non",
                          nativeInputProps: {
                            ...field,
                            value: 0,
                            defaultChecked: field.value === false,
                            onChange() {
                              setLastPourcentages(getValues("pourcentages"));
                              reset({
                                calculable: false,
                              });
                              field.onChange(false);
                            },
                          },
                        },
                      ]}
                    />
                  )}
                />
              </FormLayout>
              {computableCheck ? (
                <>
                  <p>
                    Le pourcentage de femmes et d’hommes ayant été {indicateur === 2 ? "augmentés" : "promus"} durant la
                    période de référence, doit être renseigné par CSP.
                  </p>
                  <AlternativeTable
                    header={[
                      {
                        label: "Catégories socioprofessionnelles",
                      },
                      {
                        label: `Pourcentage de salariés ${indicateur === 2 ? "augmentés" : "promus"}`,
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
                        informations: <AideSimulationIndicateurDeuxOurTrois.CommentEstCalculéLIndicateur />,
                      },
                    ]}
                    body={categories.map<AlternativeTableProps.BodyContent>(category => ({
                      categoryLabel: CSP.Label[category],
                      ...(() => {
                        const womenCount = pourcentagesWithCount[category]?.womenCount ?? 0;
                        const menCount = pourcentagesWithCount[category]?.menCount ?? 0;

                        if (womenCount < 10 && menCount < 10) {
                          return {
                            mergedLabel: "Non pris en compte car moins de 10 femmes / hommes",
                          };
                        } else if (womenCount < 10) {
                          return {
                            mergedLabel: "Non pris en compte car moins de 10 femmes",
                          };
                        } else if (menCount < 10) {
                          return {
                            mergedLabel: "Non pris en compte car moins de 10 hommes",
                          };
                        }
                        type ColsType = [AlternativeTableProps.ColType, ...AlternativeTableProps.ColType[]];
                        const categoryError = (errors as FieldErrors<Indic2or3FormTypeWhenCalculable>).pourcentages?.[
                          category
                        ];
                        return {
                          cols: [
                            {
                              label: `${category} - Femmes`,
                              state: categoryError?.women && "error",
                              stateRelatedMessage: categoryError?.women?.message,
                              nativeInputProps: {
                                ...register(`pourcentages.${category}.women`, {
                                  setValueAs: value => (value === "" ? "" : parseFloat(value)),
                                  deps: [`pourcentages.${category}.men`, "root.totalPourcentages"],
                                }),
                                title: categoryError?.women?.message,
                                type: "number",
                                min: 0,
                                max: 100,
                              },
                            },
                            {
                              label: `${category} - Hommes`,
                              state: categoryError?.men && "error",
                              stateRelatedMessage: categoryError?.men?.message,
                              nativeInputProps: {
                                ...register(`pourcentages.${category}.men`, {
                                  setValueAs: value => (value === "" ? "" : parseFloat(value)),
                                  deps: [`pourcentages.${category}.women`, "root.totalPourcentages"],
                                }),
                                title: categoryError?.men?.message,
                                type: "number",
                                min: 0,
                                max: 100,
                              },
                            },
                            (() => {
                              const { resultRaw: groupResult } = computer.computeGroup(category);

                              return !Number.isNaN(groupResult) && Number.isFinite(groupResult)
                                ? precisePercentFormat.format(groupResult / 100)
                                : "-";
                            })(),
                          ] satisfies ColsType,
                        };
                      })(),
                    }))}
                    footer={[
                      {
                        label: "Écart global",
                        colspan: 3,
                        align: "right",
                      },
                      {
                        label: (
                          <strong>
                            {!Number.isNaN(result.resultRaw) && Number.isFinite(result.resultRaw)
                              ? precisePercentFormat.format(result.resultRaw / 100)
                              : "-"}
                          </strong>
                        ),
                      },
                    ]}
                  />
                  {errors?.root?.totalPourcentages?.message && (
                    <Alert
                      className="fr-mb-5w"
                      small
                      severity="warning"
                      description={errors.root.totalPourcentages.message}
                    />
                  )}
                  <Box mb="4w">
                    <Indicateur2ou3Note computer={computer} indicateur={indicateur} isValid={isValid} />
                  </Box>
                </>
              ) : (
                computableCheck === false && (
                  <Alert
                    className="fr-mb-3w"
                    severity="info"
                    title="L'indicateur n'est pas calculable"
                    description={`Il n'y a pas eu ${
                      indicateur === 2 ? "d'augmentations" : "de promotions"
                    } durant la période de référence.`}
                  />
                )
              )}
            </>
          )}
        </ClientAnimate>

        <FormLayout>
          <BackNextButtonsGroup
            backProps={{
              linkProps: {
                href: simulateurPath(indicateurNav.prev()),
              },
            }}
            nextDisabled={!isValid}
          />
        </FormLayout>
      </form>
    </FormProvider>
  );
};
