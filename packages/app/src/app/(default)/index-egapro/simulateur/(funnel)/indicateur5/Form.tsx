"use client";

import { IndicateurCinqComputer } from "@common/core-domain/computers/IndicateurCinqComputer";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { storePicker } from "@common/utils/zustand";
import { NumberPairInputs } from "@components/RHF/NumbersPairInputs";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, FormLayout, IndicatorNote } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";

type Indic5FormType = z.infer<typeof createSteps.indicateur5>;

const indicateur5Computer = new IndicateurCinqComputer();
const indicateur5Nav = NAVIGATION.indicateur5;

const useStore = storePicker(useSimuFunnelStore);
export const Indic5Form = () => {
  const router = useRouter();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const hydrated = useSimuFunnelStoreHasHydrated();

  const methods = useForm<Indic5FormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.indicateur5),
    defaultValues: funnel?.indicateur5,
  });

  const {
    formState: { isValid },
    handleSubmit,
    watch,
  } = methods;

  if (!hydrated) {
    return <SkeletonForm fields={2} />;
  }

  if (!funnel?.effectifs) {
    redirect(simulateurPath("effectifs"));
  }

  indicateur5Computer.setInput(watch());
  const computed = indicateur5Computer.compute();

  const onSubmit = (indicateur5: Indic5FormType) => {
    saveFunnel({ indicateur5 });
    router.push(simulateurPath(indicateur5Nav.next()));
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormLayout>
          <NumberPairInputs<Indic5FormType>
            first={{
              formKey: "women",
              label: "Nombre de femmes parmi les 10 plus hautes rémunérations*",
            }}
            second={{
              formKey: "men",
              label: "Nombre d'hommes parmi les 10 plus hautes rémunérations*",
            }}
            options={{
              max: 10,
              min: 0,
              step: 1,
            }}
          />
          <IndicatorNote
            className="fr-mt-4w"
            note={isValid ? computed.note : "-"}
            max={10}
            text="Nombre de points obtenus à l'indicateur hautes rémunérations"
            legend={
              isValid
                ? computed.favorablePopulation === "equality"
                  ? "Les hommes et les femmes sont à parité parmi les salariés les mieux rémunérés."
                  : computed.favorablePopulation === "men"
                    ? "Les hommes sont sur-représentés parmi les salariés les mieux rémunérés."
                    : "Les femmes sont sur-représentées parmi les salariés les mieux rémunérés."
                : "Veuillez renseigner les champs obligatoires pour obtenir le nombre de points à l'indicateur"
            }
          />
          <BackNextButtonsGroup
            className="fr-mt-4w"
            backProps={{
              linkProps: {
                href: simulateurPath(indicateur5Nav.prev()),
              },
            }}
            nextDisabled={!isValid}
          />
        </FormLayout>
      </form>
    </FormProvider>
  );
};
