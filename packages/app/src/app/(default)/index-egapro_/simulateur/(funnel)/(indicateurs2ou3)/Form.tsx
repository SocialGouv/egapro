"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { IndicateurDeuxComputer, type Percentages } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import {
  ageRanges,
  categories,
  type ExternalRemunerations,
  flattenRemunerations,
} from "@common/core-domain/computers/utils";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import {
  type CreateSimulationDTO,
  type CreateSimulationWorkforceRangeMoreThan250DTO,
  createSteps,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { precisePercentFormat } from "@common/utils/number";
import { Object } from "@common/utils/overload";
import { storePicker } from "@common/utils/zustand";
import { AideSimulationIndicateurDeux } from "@components/aide-simulation/IndicateurDeux";
import { AideSimulationIndicateurTrois } from "@components/aide-simulation/IndicateurTrois";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { AlternativeTable, type AlternativeTableProps, BackNextButtonsGroup, Box, FormLayout } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { Indicateur2ou3Note } from "./Indicateur2ou3Note";

type Indic2or3FormType = z.infer<typeof createSteps.indicateur2>;
type Indic2or3FormTypeWhenCalculable = Extract<Indic2or3FormType, { calculable: true }>;

const indicateur2Computer = new IndicateurDeuxComputer();
const indicateur3Computer = new IndicateurTroisComputer();

interface Indic2or3FormProps {
  indicateur: 2 | 3;
}

const getPourcentagesWithCount = (
  funnelCsp: CreateSimulationDTO["effectifs"]["csp"],
  pourcentages: Percentages | undefined,
) =>
  Object.keys(funnelCsp).reduce(
    (newPourcentages, category) => ({
      ...newPourcentages,
      [category]: {
        menCount: ageRanges.reduce(
          (totalCategoryCount, ageRange) => totalCategoryCount + (funnelCsp[category].ageRanges[ageRange].men ?? 0),
          0,
        ),
        womenCount: ageRanges.reduce(
          (totalCategoryCount, ageRange) => totalCategoryCount + (funnelCsp[category].ageRanges[ageRange].women ?? 0),
          0,
        ),
        men: pourcentages?.[category]?.men ?? 0,
        women: pourcentages?.[category]?.women ?? 0,
      } as Percentages[CSP.Enum],
    }),
    {} as Percentages,
  );

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
    resolver: zodResolver(createSteps.indicateur3),
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

  const resultIndicateurUn = computerIndicateurUn.compute();

  const computableCheck = watch("calculable");
  const pourcentages = watch("pourcentages");

  // add count from "funnel.effectifs.csp" to pourcentages, to make pourcentagesWithCount
  const pourcentagesWithCount = getPourcentagesWithCount(funnel.effectifs.csp, pourcentages as Percentages);

  computer.setInput(pourcentagesWithCount);
  const canCompute = computer.canCompute();

  const result = computer.compute();

  const onSubmit = async (indicateur2or3: Indic2or3FormType) => {
    saveFunnel({ [`indicateur${indicateur}`]: indicateur2or3 });
    router.push(simulateurPath(indicateurNav.next()));
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
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

        <ClientAnimate>
          {!canCompute ? (
            <Alert
              className="fr-mb-3w"
              severity="warning"
              title="L'indicateur n'est pas calculable"
              description="L’ensemble des groupes valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
            />
          ) : computableCheck ? (
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
                              setValueAs: value => (value === "" ? void 0 : +value),
                              deps: `pourcentages.${category}.men`,
                            }),
                            title: categoryError?.women?.message,
                            type: "number",
                            min: 1,
                            max: 100,
                          },
                        },
                        {
                          label: `${category} - Hommes`,
                          state: categoryError?.men && "error",
                          stateRelatedMessage: categoryError?.men?.message,
                          nativeInputProps: {
                            ...register(`pourcentages.${category}.men`, {
                              setValueAs: value => (value === "" ? void 0 : +value),
                              deps: `pourcentages.${category}.women`,
                            }),
                            title: categoryError?.men?.message,
                            type: "number",
                            min: 1,
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

              <Box mb="4w">
                <Indicateur2ou3Note
                  computer={computer}
                  resultIndicateurUn={resultIndicateurUn}
                  indicateur={indicateur}
                />
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
