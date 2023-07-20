"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import {
  computeIndicator2And3Note,
  indicatorNoteMax,
} from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodPositiveOrZeroNumberSchema, zodRadioInputSchema } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
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

const formSchema = zodFr
  .object({
    estCalculable: zodRadioInputSchema,
    motifNonCalculabilité: z.string().optional(),
    populationFavorable: z.string(),
    résultat: zodPositiveOrZeroNumberSchema,
    résultatEquivalentSalarié: zodPositiveOrZeroNumberSchema,
    note: z.number(),
    noteSurRésultatFinal: z.number(),
    noteSurNbEqSal: z.number(),
  })
  .superRefine(({ résultat, résultatEquivalentSalarié, populationFavorable }, ctx) => {
    if ((résultat !== 0 || résultatEquivalentSalarié !== 0) && !populationFavorable) {
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
  const noteSurRésultatFinal = watch("noteSurRésultatFinal");
  const noteSurNbEqSal = watch("noteSurNbEqSal");
  const estCalculable = watch("estCalculable");

  // Synchronize noteSurRésultatFinal.
  useEffect(() => {
    const noteSurRésultatFinal = computeIndicator2And3Note(résultat);
    setValue("noteSurRésultatFinal", noteSurRésultatFinal);
  }, [résultat, setValue]);

  // Synchronize noteSurNbEqSal.
  useEffect(() => {
    const noteSurNbEqSal = computeIndicator2And3Note(résultatEquivalentSalarié);
    setValue("noteSurNbEqSal", noteSurNbEqSal);
  }, [résultatEquivalentSalarié, setValue]);

  // Compute note.
  useEffect(() => {
    setValue("note", Math.max(noteSurRésultatFinal, noteSurNbEqSal));
  }, [noteSurRésultatFinal, noteSurNbEqSal, setValue]);

  // Disable populationFavorable where appropriate.
  useEffect(() => {
    if (résultat === 0 && résultatEquivalentSalarié === 0) {
      setPopulationFavorableDisabled(true);
      setValue("populationFavorable", "");
    } else {
      setPopulationFavorableDisabled(false);
    }
  }, [résultat, résultatEquivalentSalarié, setValue]);

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

          <RadioOuiNon
            legend="L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ?"
            name="estCalculable"
          />

          {estCalculable && (
            <>
              {estCalculable === "non" ? (
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
              ) : (
                <>
                  <PercentageInput label="Résultat final en %" name="résultat" min={0} />

                  <PercentageInput
                    label="Résultat final en nombre équivalent de salariés"
                    name="résultatEquivalentSalarié"
                    min={0}
                  />

                  <PopulationFavorable disabled={populationFavorableDisabled} />

                  {noteSurRésultatFinal !== undefined && (
                    <IndicatorNote
                      note={noteSurRésultatFinal}
                      max={indicatorNoteMax.augmentations_et_promotions}
                      text="Nombre de points obtenus sur le résultat final en %"
                    />
                  )}

                  {noteSurNbEqSal !== undefined && (
                    <IndicatorNote
                      note={noteSurNbEqSal}
                      max={indicatorNoteMax.augmentations_et_promotions}
                      text="Nombre de points obtenus sur le résultat final en nombre équivalent de salariés"
                      className={fr.cx("fr-mt-2w")}
                    />
                  )}

                  {note !== undefined && (
                    <>
                      <IndicatorNote
                        note={note}
                        max={indicatorNoteMax.augmentations_et_promotions}
                        text="Nombre de points obtenus à l'indicateur"
                        className={fr.cx("fr-mt-2w")}
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
                </>
              )}
            </>
          )}
        </ClientOnly>

        <BackNextButtons stepName={stepName} disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
