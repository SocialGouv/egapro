"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import {
  computeIndicator2And3Note,
  indicatorNoteMax,
} from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodRadioInputSchema } from "@common/utils/form";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ReactHookFormDebug } from "@components/RHF/ReactHookFormDebug";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { IndicatorNote } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState, labelsMotifNC, motifsNC } from "@services/form/declaration/DeclarationFormBuilder";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = z
  .object({
    estCalculable: zodRadioInputSchema,
    motifNonCalculabilité: z.string().optional(),
    populationFavorable: z.string(),
    résultat: z
      .number({ invalid_type_error: "Le champ est requis", required_error: "Le champ est requis" })
      .positive({ message: "La valeur doit être positive" }),
    résultatEquivalentSalarié: z
      .number({ invalid_type_error: "Le champ est requis", required_error: "Le champ est requis" })
      .positive({ message: "La valeur doit être positive" }),
    note: z.number(),
  })
  .superRefine(({ note, populationFavorable }, ctx) => {
    if (note !== indicatorNoteMax.augmentations_et_promotions && !populationFavorable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La population envers laquelle l'écart est favorable est obligatoire",
        path: ["populationFavorable"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "augmentations-et-promotions";

export const AugmentationEtPromotionsForm = () => {
  const { formData, saveFormData } = useDeclarationFormManager();
  const router = useRouter();
  const [populationFavorableDisabled, setPopulationFavorableDisabled] = useState<boolean>();

  const methods = useForm<FormType>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.debug("formData", data);
      // console.debug("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },
    mode: "onChange",
    // resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
    setValue,
    watch,
  } = methods;

  const résultat = watch("résultat");
  const résultatEquivalentSalarié = watch("résultatEquivalentSalarié");
  const note = watch("note");
  const estCalculable = watch("estCalculable");

  useEffect(() => {
    const note = computeIndicator2And3Note(résultat);
    setValue("note", note);
    if (note === indicatorNoteMax.augmentations_et_promotions) {
      setPopulationFavorableDisabled(true);
      setValue("populationFavorable", "");
    }
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
          <ReactHookFormDebug />

          <RadioOuiNon
            legend="L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ?"
            name="estCalculable"
          />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "non" && (
              <>
                <Select
                  label="Précision du motif de non calculabilité de l'indicateur"
                  nativeSelectProps={{ ...register("motifNonCalculabilité") }}
                  state={errors.motifNonCalculabilité ? "error" : "default"}
                  stateRelatedMessage={errors.motifNonCalculabilité?.message}
                >
                  <option value="" disabled hidden>
                    Selectionnez une option
                  </option>
                  {motifsNC["augmentations-et-promotions"].map(motif => (
                    <option key={motif} value={motif}>
                      {labelsMotifNC[motif]}
                    </option>
                  ))}
                </Select>
              </>
            )}
          </ClientOnly>

          <PercentageInput label="Résultat final en %" name="résultat" min={0} />

          <PercentageInput
            label="Résultat final en nombre équivalent de salariés"
            name="résultatEquivalentSalarié"
            min={0}
          />

          <PopulationFavorable disabled={populationFavorableDisabled} />

          {note !== undefined && (
            <>
              <IndicatorNote
                note={note}
                max={indicatorNoteMax.augmentations_et_promotions}
                text="Nombre de points obtenus à l'indicateur"
              />

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
