"use client";

import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { zodFr } from "@common/utils/zod";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { IndicatorNote } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "remunerations-resultat";

const formSchema = zodFr
  .object({
    note: z.number(),
    populationFavorable: z.string().optional(),
    résultat: z
      .number({ invalid_type_error: "Le résultat est obligatoire" })
      .nonnegative("Le résultat ne peut pas être inférieur à 0"),
  })
  .superRefine(({ résultat, populationFavorable }, ctx) => {
    if (résultat !== 0 && !populationFavorable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La population envers laquelle l'écart est favorable est obligatoire",
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
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
    shouldUnregister: true,
  });

  const {
    register,
    handleSubmit,
    formState: { isValid },
    setValue,
    watch,
  } = methods;

  useEffect(() => {
    register("note");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const résultat = watch("résultat");
  const note = watch("note");

  useEffect(() => {
    if (résultat !== null) {
      const note = new IndicateurUnComputer().computeNote(résultat);
      setValue("note", note);
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
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          <PercentageInput<FormType> label="Résultat final obtenu à l'indicateur en %" name="résultat" min={0} />

          {résultat !== 0 && résultat !== null && <PopulationFavorable />}

          {résultat !== null && (
            <>
              <IndicatorNote
                note={note}
                max={indicatorNoteMax.remunerations}
                text="Nombre de points obtenus à l'indicateur"
              />
            </>
          )}
        </ClientOnly>

        <BackNextButtons stepName={stepName} disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
