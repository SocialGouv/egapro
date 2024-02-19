"use client";

import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { zodNumberOrEmptyString } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { IndicatorNoteInput } from "@components/RHF/IndicatorNoteInput";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { MANDATORY_FAVORABLE_POPULATION, MANDATORY_RESULT, NOT_BELOW_0 } from "../../../messages";
import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "remunerations-resultat";

const formSchema = zodFr
  .object({
    note: z.number(),
    populationFavorable: z.string().optional(),
    résultat: zodNumberOrEmptyString, // Infered as number | string for usage in this React Component (see below).
  })
  .superRefine(({ résultat, populationFavorable }, ctx) => {
    if (résultat === "") {
      // But it won't accept an empty string thanks to superRefine rule.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: MANDATORY_RESULT,
        path: ["résultat"],
      });
    } else if (résultat < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: NOT_BELOW_0,
        path: ["résultat"],
      });
    } else if (résultat !== 0 && !populationFavorable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: MANDATORY_FAVORABLE_POPULATION,
        path: ["populationFavorable"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

export const RemunerationResultatForm = () => {
  const router = useRouter();
  const { formData, saveFormData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  const methods = useForm<FormType>({
    mode: "onChange",
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName] || { résultat: "" },
  });

  const {
    handleSubmit,
    formState: { isValid },
    setValue,
    getValues,
    watch,
  } = methods;

  const résultat = watch("résultat") || getValues("résultat");
  const note = watch("note");

  useEffect(() => {
    if (résultat !== "") {
      const note = new IndicateurUnComputer().computeNote(résultat);
      setValue("note", note, { shouldValidate: true });
    }
  }, [résultat, setValue]);

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      draft[stepName] = data as DeclarationDTO[typeof stepName];
    });

    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientAnimate>
          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            <PercentageInput<FormType>
              label="Résultat final obtenu à l'indicateur en %"
              name="résultat"
              min={0}
              hintText={
                "(il s'agit de la valeur absolue de l’écart global de rémunération, arrondie à la première décimale)"
              }
            />

            {résultat !== 0 && résultat !== "" && <PopulationFavorable />}

            {note !== undefined && isValid && (
              <>
                <IndicatorNoteInput
                  max={indicatorNoteMax.remunerations}
                  text="Nombre de points obtenus à l'indicateur"
                />
              </>
            )}
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </ClientAnimate>
      </form>
    </FormProvider>
  );
};
