"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { setValueAsFloatOrEmptyString, zodNumberOrEmptyString } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { IndicatorNoteInput } from "@components/RHF/IndicatorNoteInput";
import { MotifNC } from "@components/RHF/MotifNC";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { getModifiedFormValues } from "@components/utils/getModifiedFormValues";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { MANDATORY_FAVORABLE_POPULATION, MANDATORY_RESULT, NOT_BELOW_0 } from "../../../messages";
import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr
  .discriminatedUnion("estCalculable", [
    zodFr.object({
      estCalculable: z.literal("non"),
      motifNonCalculabilité: z.string(),
    }),
    zodFr.object({
      estCalculable: z.literal("oui"),
      populationFavorable: z.string().optional(),
      résultat: zodNumberOrEmptyString, // Infered as number | string for usage in this React Component (see below).
      résultatEquivalentSalarié: zodNumberOrEmptyString,
      note: z.number(),
      notePourcentage: z.number(),
      noteNombreSalaries: z.number(),
    }),
  ])
  .superRefine((value, ctx) => {
    if (value.estCalculable === "oui") {
      if (value.résultat === "") {
        // But it won't accept an empty string thanks to superRefine rule.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: MANDATORY_RESULT,
          path: ["résultat"],
        });
      } else if (value.résultat < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: NOT_BELOW_0,
          path: ["résultat"],
        });
      }

      if (value.résultatEquivalentSalarié === "") {
        // But it won't accept an empty string thanks to superRefine rule.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: MANDATORY_RESULT,
          path: ["résultatEquivalentSalarié"],
        });
      } else if (value.résultatEquivalentSalarié < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: NOT_BELOW_0,
          path: ["résultatEquivalentSalarié"],
        });
      }

      if ((value.résultat !== 0 || value.résultatEquivalentSalarié !== 0) && !value.populationFavorable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: MANDATORY_FAVORABLE_POPULATION,
          path: ["populationFavorable"],
        });
      }
    } else if (value.estCalculable === "non" && !value.motifNonCalculabilité) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le motif de non calculabilité est obligatoire",
        path: ["motifNonCalculabilité"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;
type FormTypeWhenCalculable = Extract<FormType, { estCalculable: "oui" }>;

const stepName: FunnelKey = "augmentations-et-promotions";

export const AugmentationEtPromotionsForm = () => {
  const router = useRouter();
  const { formData, saveFormData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  const methods = useForm<FormType>({
    mode: "onChange",
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    formState: { isValid, errors, dirtyFields },
    setValue,
    getValues,
    unregister,
    watch,
  } = methods;

  const estCalculable = watch("estCalculable");
  const résultat = watch("résultat") || getValues("résultat");
  const résultatEquivalentSalarié = watch("résultatEquivalentSalarié");
  const note = watch("note");
  const notePourcentage = watch("notePourcentage");
  const populationFavorable = watch("populationFavorable");
  const noteNombreSalaries = watch("noteNombreSalaries");
  const errorsWhenCalculable = errors as FieldErrors<FormTypeWhenCalculable>;

  const estUnRattrapage =
    formData["remunerations-resultat"]?.populationFavorable &&
    populationFavorable &&
    formData["remunerations-resultat"]?.populationFavorable !== populationFavorable;

  // Sync notes and populationFavorable with result fields.
  useEffect(() => {
    let notePourcentage, noteNombreSalaries;
    if (résultat !== undefined && résultat !== "") {
      notePourcentage = new IndicateurDeuxTroisComputer(new IndicateurUnComputer()).computeNote(résultat);
      setValue("notePourcentage", notePourcentage, { shouldValidate: true });
    }
    if (résultatEquivalentSalarié !== undefined && résultatEquivalentSalarié !== "") {
      noteNombreSalaries = new IndicateurDeuxTroisComputer(new IndicateurUnComputer()).computeNote(
        résultatEquivalentSalarié,
      );
      setValue("noteNombreSalaries", noteNombreSalaries, { shouldValidate: true });
    }
    if (notePourcentage !== undefined && noteNombreSalaries !== undefined) {
      setValue("note", Math.max(notePourcentage, noteNombreSalaries), { shouldValidate: true });
    }

    // If it is a compensation, we set the note to the max value.
    if (estUnRattrapage) setValue("note", indicatorNoteMax[stepName], { shouldValidate: true, shouldDirty: true });
  }, [
    estCalculable,
    estUnRattrapage,
    noteNombreSalaries,
    notePourcentage,
    résultat,
    résultatEquivalentSalarié,
    register,
    setValue,
    unregister,
  ]);

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      // Prevent stale data mixing with new data
      if (data.estCalculable !== formData[stepName]?.estCalculable) {
        draft[stepName] = getModifiedFormValues(dirtyFields, data) as DeclarationDTO[typeof stepName];
      } else {
        draft[stepName] = data as DeclarationDTO[typeof stepName];
      }
    });
    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
        <ClientAnimate>
          {/* Needs to be outside ClientOnly to not be unregistered by RHF. Be careful! */}
          <RadioOuiNon
            legend="L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ? *"
            name="estCalculable"
          />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "non" && <MotifNC stepName={stepName} />}

            {estCalculable === "oui" && (
              <>
                <PercentageInput<FormType>
                  label="Résultat final obtenu à l'indicateur en % *"
                  name="résultat"
                  hintText={"(il s'agit de l'écart absolu de taux d’augmentations, arrondi à la première décimale.)"}
                  min={0}
                  roundNumber={1}
                />

                <Input
                  nativeInputProps={{
                    type: "number",
                    min: 0,
                    step: 0.1,
                    defaultValue: "",
                    ...register("résultatEquivalentSalarié", {
                      setValueAs: setValueAsFloatOrEmptyString,
                    }),
                    onBlur: e => {
                      // Round number to 1 decimal.
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setValue("résultatEquivalentSalarié", Math.round(value * 10) / 10, { shouldValidate: true });
                      }
                    },
                  }}
                  label="Résultat final obtenu à l'indicateur en nombre équivalent de salariés *"
                  hintText={"(il s'agit de l'écart en nombre équivalent de salariés, arrondi à la première décimale.)"}
                  state={errorsWhenCalculable["résultatEquivalentSalarié"] && "error"}
                  stateRelatedMessage={errorsWhenCalculable["résultatEquivalentSalarié"]?.message || ""}
                />

                {(résultat !== 0 || résultatEquivalentSalarié !== 0) && <PopulationFavorable />}

                {notePourcentage !== undefined && (
                  <IndicatorNoteInput
                    name="notePourcentage"
                    max={indicatorNoteMax[stepName]}
                    text="Nombre de points obtenus sur le résultat final en %"
                  />
                )}

                {noteNombreSalaries !== undefined && (
                  <IndicatorNoteInput
                    name="noteNombreSalaries"
                    max={indicatorNoteMax[stepName]}
                    text="Nombre de points obtenus sur le résultat final en nombre équivalent de salariés"
                    className={fr.cx("fr-mt-2w")}
                  />
                )}

                {note !== undefined && isValid && (
                  <>
                    <IndicatorNoteInput
                      max={indicatorNoteMax[stepName]}
                      text="Nombre de points obtenus à l'indicateur"
                      className={fr.cx("fr-mt-2w")}
                    />

                    {estUnRattrapage && (
                      <Alert
                        severity="info"
                        title=""
                        description="L’écart constaté étant en faveur du sexe le moins bien rémunéré (indicateur écart de rémunération), le nombre de points maximum à l’indicateur est attribué, considérant qu'une politique de rattrapage adaptée a été mise en place."
                        className={fr.cx("fr-mt-2w")}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </ClientAnimate>
      </form>
    </FormProvider>
  );
};
