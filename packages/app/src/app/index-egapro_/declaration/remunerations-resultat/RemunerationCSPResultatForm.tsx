"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { computeIndicator1Note } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodRealPercentageSchema } from "@common/utils/form";
import { IndicatorNote } from "@components/IndicatorNote";
import { PopulationFavorable } from "@components/PopulationFavorable";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import produce from "immer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { funnelConfig, type FunnelKey } from "../../declarationFunnelConfiguration";
import { BackNextButtons } from "../BackNextButtons";

const formSchema = z
  .object({
    note: z.number(),
    populationFavorable: z.string(),
    résultat: zodRealPercentageSchema,
  })
  .superRefine(({ note, populationFavorable }, ctx) => {
    if (note !== 40 && !populationFavorable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La population envers laquelle l'écart est favorable est obligatoire",
        path: ["populationFavorable"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "remunerations-resultat";

export const RemunerationCSPResultatForm = () => {
  const { formData, saveFormData } = useDeclarationFormManager();
  const router = useRouter();
  const [populationFavorableDisabled, setPopulationFavorableDisabled] = useState<boolean>();

  const methods = useForm<FormType>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.log("formData", data);
      // console.log("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },
    mode: "onChange",
    // resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = methods;

  const résultat = watch("résultat");
  const note = watch("note");

  useEffect(() => {
    const note = computeIndicator1Note(résultat);
    setValue("note", note);
    setPopulationFavorableDisabled(note === 40);
    if (note === 40) setValue("populationFavorable", "");
  }, [résultat, setValue]);

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      draft[stepName] = data as DeclarationFormState[typeof stepName];
    });

    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          {/* <ReactHookFormDebug /> */}

          <Input
            label="Résultat final en % après application du seuil de pertinence à chaque catégorie ou niveau/coefficient"
            nativeInputProps={{
              type: "number",
              min: 0,
              max: 100,
              ...register(`résultat`, { valueAsNumber: true }),
            }}
            state={errors.résultat?.message ? "error" : "default"}
            stateRelatedMessage={errors.résultat?.message}
          />

          <PopulationFavorable disabled={populationFavorableDisabled} />

          {note !== undefined && (
            <>
              <IndicatorNote note={note} max={40} />

              <Input
                label=""
                nativeInputProps={{
                  type: "hidden",
                  value: note,
                  ...register(`note`, { valueAsNumber: true }),
                }}
              />
            </>
          )}
        </ClientOnly>

        <BackNextButtons stepName={stepName} disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
