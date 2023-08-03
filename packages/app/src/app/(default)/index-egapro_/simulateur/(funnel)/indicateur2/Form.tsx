"use client";

import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type Increases, IndicateurDeuxComputer } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { ageRanges, categories } from "@common/core-domain/computers/IndicateurUnComputer";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";
import { storePicker } from "@common/utils/zustand";
import { AideSimulationIndicateurDeux } from "@components/aide-simulation/IndicateurDeux";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { AlternativeTable, BackNextButtonsGroup, FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";

type Indic2FormType = z.infer<typeof createSteps.indicateur2>;
const indicateur2Nav = NAVIGATION.indicateur2;

const computer = new IndicateurDeuxComputer();

const useStore = storePicker(useSimuFunnelStore);
export const Indic2Form = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [funnel, saveFunnel, resetFunnel] = useStore("funnel", "saveFunnel", "resetFunnel");
  const hydrated = useSimuFunnelStoreHasHydrated();

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    getValues,
    setValue,
    trigger,
    watch,
    control,
  } = useForm<Indic2FormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.indicateur2),
    defaultValues: funnel?.indicateur2,
  });

  if (!hydrated) {
    return <SkeletonForm fields={2} />;
  }

  if (!funnel?.effectifs) {
    redirect(simulateurPath("effectifs"));
  }

  const computableCheck = watch("calculable");

  const pourcentages = watch("pourcentages");

  // add count from "funnel.effectifs.csp" to pourcentages, to make pourcentagesWithCount
  const pourcentagesWithCount = Object.keys(funnel.effectifs.csp).reduce(
    (newPourcentages, category) => ({
      ...newPourcentages,
      [category]: {
        menCount: ageRanges.reduce(
          (totalCategoryCount, ageRange) =>
            totalCategoryCount + (funnel.effectifs?.csp[category].ageRanges[ageRange].men ?? 0),
          0,
        ),
        womenCount: ageRanges.reduce(
          (totalCategoryCount, ageRange) =>
            totalCategoryCount + (funnel.effectifs?.csp[category].ageRanges[ageRange].women ?? 0),
          0,
        ),
        menIncreaseCount: pourcentages?.[category]?.men ?? 0,
        womenIncreaseCount: pourcentages?.[category]?.women ?? 0,
      } as Increases[CSP.Enum],
    }),
    {} as Increases,
  );

  computer.setIncreases(pourcentagesWithCount);
  const canCompute = computer.canCompute();
  const result = computer.compute();

  console.log({ pourcentagesWithCount, canCompute, result });

  return (
    <form>
      <FormLayout>
        <Controller
          control={control}
          name="calculable"
          render={({ field, fieldState }) => (
            <RadioButtons
              orientation="horizontal"
              legend="Y a-t-il eu des augmentations individuelles (hors promotions) durant la période de référence ?"
              hintText="Il s'agit des augmentations individuelles du salaire de base, en excluant celles liées à une promotion."
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
                      field.onChange(false);
                    },
                  },
                },
              ]}
            />
          )}
        />
      </FormLayout>

      {computableCheck && (
        <AlternativeTable
          header={[
            {
              label: "Catégories socioprofessionnelles",
            },
            {
              label: "Pourcentage de salariés augmentés",
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
              informations: <AideSimulationIndicateurDeux.CommentEstCalculéLIndicateur />,
            },
          ]}
          body={categories.map(category => ({
            categoryLabel: CSP.Label[category],
            ...(() => {
              const csp = funnel!.effectifs!.csp[category];

              return {
                cols: [
                  {
                    label: `${category} - Femmes`,
                    nativeInputProps: {
                      ...register(`pourcentages.${category}.women`, {
                        deps: `pourcentages.${category}.men`,
                      }),
                    },
                  },
                  {
                    label: `${category} - Hommes`,
                    nativeInputProps: {
                      ...register(`pourcentages.${category}.men`, {
                        deps: `pourcentages.${category}.women`,
                      }),
                    },
                  },
                  "-",
                ],
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
              label: "-",
            },
          ]}
        />
      )}

      <FormLayout>
        <BackNextButtonsGroup
          backProps={{
            linkProps: {
              href: simulateurPath(indicateur2Nav.prev()),
            },
          }}
          nextDisabled={!isValid}
        />
      </FormLayout>
    </form>
  );
};
