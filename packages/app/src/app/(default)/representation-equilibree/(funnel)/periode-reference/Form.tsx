"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import CallOut from "@codegouvfr/react-dsfr/CallOut";
import Input from "@codegouvfr/react-dsfr/Input";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { storePicker } from "@common/utils/zustand";
import { FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { endOfYear, formatISO, getYear } from "date-fns";
import { redirect, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import { z } from "zod";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

const formSchema = createSteps.periodeReference.and(createSteps.commencer).superRefine(({ endOfPeriod, year }, ctx) => {
  if (getYear(new Date(endOfPeriod)) !== year) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "L'année de la date de fin de la période doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés",
      path: ["endOfPeriod"],
    });
  }
});
type PeriodeReferenceFormType = z.infer<typeof formSchema>;

const useStore = storePicker(useRepeqFunnelStore);
export const PeriodeReferenceForm = () => {
  const router = useRouter();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const hydrated = useRepeqFunnelStoreHasHydrated();

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    setValue,
  } = useForm<PeriodeReferenceFormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: funnel,
  });

  const selectEndDateOfFunnelYear = () => {
    if (!funnel?.year) return;
    setValue("endOfPeriod", formatISO(endOfYear(new Date().setFullYear(funnel.year)), { representation: "date" }), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async ({ endOfPeriod }: PeriodeReferenceFormType) => {
    saveFunnel({ endOfPeriod });
    router.push("/representation-equilibree/ecarts-cadres");
  };

  if (funnel && !funnel?.year) redirect("/representation-equilibree/commencer");

  return (
    <>
      <CallOut
        title="Année civile"
        iconId="fr-icon-calendar-line"
        buttonProps={{
          priority: "secondary",
          children: "Sélectionner la fin de l'année civile",
          size: "small",
          onClick: selectEndDateOfFunnelYear,
        }}
      >
        <u>
          <strong>{hydrated ? funnel?.year : <Skeleton inline width="4ch" />}</strong>
        </u>{" "}
        est l'année au titre de laquelle les écarts de représentation sont calculés.
      </CallOut>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormLayout>
          <Input
            label="Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul des écarts"
            state={errors.endOfPeriod && "error"}
            stateRelatedMessage={errors.endOfPeriod?.message}
            nativeInputProps={{
              type: "date",
              placeholder: "Sélectionner une date",
              ...register("endOfPeriod"),
            }}
          />
          <ButtonsGroup
            inlineLayoutWhen="sm and up"
            buttons={[
              {
                children: "Précédent",
                linkProps: {
                  href: "/representation-equilibree/entreprise",
                },
                priority: "secondary",
              },
              {
                children: "Suivant",
                type: "submit",
                disabled: !isValid,
              },
            ]}
          />
        </FormLayout>
      </form>
    </>
  );
};
