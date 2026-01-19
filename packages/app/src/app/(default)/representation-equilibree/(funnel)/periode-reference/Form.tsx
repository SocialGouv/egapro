"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import Input from "@codegouvfr/react-dsfr/Input";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { storePicker } from "@common/utils/zustand";
import { BackNextButtonsGroup, FormLayout } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { endOfYear, formatISO, getYear } from "date-fns";
import { useRouter } from "next/navigation";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
    getValues,
  } = useForm<PeriodeReferenceFormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: funnel,
  });

  // Debug logging
  useEffect(() => {
    console.log('PeriodeReferenceForm errors:', errors);
    console.log('PeriodeReferenceForm isValid:', isValid);
    console.log('PeriodeReferenceForm funnel:', funnel);
    console.log('PeriodeReferenceForm form values:', getValues());
  }, [errors, isValid, funnel, getValues]);

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

  useEffect(() => {
    if (funnel?.siren) setValue("siren", funnel.siren);
    if (funnel?.year) setValue("year", funnel.year);
  }, [funnel?.siren, funnel?.year, setValue]);

  useEffect(() => {
    if (hydrated && !funnel?.year) {
      router.push("/representation-equilibree/commencer");
    }
  }, [hydrated, funnel?.year, router]);

  return (
    <>
      <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
      <Highlight className="fr-ml-0" size="lg">
        <u>
          <strong>{hydrated ? funnel?.year : <Skeleton inline width="4ch" />}</strong>
        </u>{" "}
        est l'année au titre de laquelle les écarts de représentation sont calculés.
      </Highlight>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Hidden inputs for schema validation */}
        <input type="hidden" {...register("siren")} value={funnel?.siren} />
        <input type="hidden" {...register("year", { valueAsNumber: true })} value={funnel?.year} />
        <FormLayout>
          <Input
            label="Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul des écarts *"
            state={errors.endOfPeriod && "error"}
            stateRelatedMessage={errors.endOfPeriod?.message}
            nativeInputProps={{
              type: "date",
              placeholder: "Sélectionner une date",
              min: `${funnel?.year}-01-01`,
              max: `${funnel?.year}-12-31`,
              ...register("endOfPeriod"),
            }}
          />
          <Button
            type="button"
            size="small"
            onClick={selectEndDateOfFunnelYear}
            priority="secondary"
            className="fr-mt-0"
          >
            Sélectionner la fin de l'année civile
          </Button>
          <BackNextButtonsGroup
            backProps={{
              linkProps: {
                href: "/representation-equilibree/entreprise",
              },
            }}
            nextDisabled={!isValid}
          />
        </FormLayout>
      </form>
    </>
  );
};
