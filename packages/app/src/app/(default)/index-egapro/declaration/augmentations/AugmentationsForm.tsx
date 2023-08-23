"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  computeIndicator2Note,
  indicatorNoteMax,
} from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodNumberOrNaNOrNull, zodPositiveOrZeroNumberSchema } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { MotifNC } from "@components/RHF/MotifNC";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
// Import your language translation files
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "augmentations";

const zodCategories = z.tuple([
  z.object({ nom: z.literal("ouv"), écarts: zodNumberOrNaNOrNull }),
  z.object({ nom: z.literal("emp"), écarts: zodNumberOrNaNOrNull }),
  z.object({ nom: z.literal("tam"), écarts: zodNumberOrNaNOrNull }),
  z.object({ nom: z.literal("ic"), écarts: zodNumberOrNaNOrNull }),
]);

const formSchema = zodFr
  .discriminatedUnion("estCalculable", [
    zodFr.object({
      estCalculable: z.literal("non"),
      motifNonCalculabilité: z.string(),
    }),
    zodFr.object({
      estCalculable: z.literal("oui"),
      populationFavorable: z.string().optional(),
      résultat: zodPositiveOrZeroNumberSchema,
      note: z.number(),
      catégories: zodCategories,
    }),
  ])
  .superRefine((value, ctx) => {
    if (value.estCalculable === "oui") {
      if (value.résultat !== 0 && !value.populationFavorable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La population envers laquelle l'écart est favorable est obligatoire",
          path: ["populationFavorable"],
        });
      }

      if (!value.catégories.some(catégorie => catégorie.écarts !== null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Au moins une catégorie doit avoir un écart renseigné",
          path: ["catégories"],
        });
      }
    }
  });

type FormType = z.infer<typeof formSchema>;

export const AugmentationsForm = () => {
  const { formData, saveFormData } = useDeclarationFormManager();
  const router = useRouter();
  const [populationFavorableDisabled, setPopulationFavorableDisabled] = useState<boolean>();

  const methods = useForm<FormType>({
    // shouldUnregister: true,
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName] || {
      catégories: [
        { nom: "ouv", écarts: null },
        { nom: "emp", écarts: null },
        { nom: "tam", écarts: null },
        { nom: "ic", écarts: null },
      ],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isValid, errors: _errors },
    setValue,
    watch,
  } = methods;

  useEffect(() => {
    register("note");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const résultat = watch("résultat");
  const note = watch("note");
  const estCalculable = watch("estCalculable");
  const catégories = watch("catégories");
  const populationFavorable = watch("populationFavorable");

  const estUnRattrapage =
    formData["remunerations-resultat"]?.populationFavorable &&
    populationFavorable &&
    formData["remunerations-resultat"]?.populationFavorable !== populationFavorable;

  useEffect(() => {
    if (estCalculable === "oui") {
      if (!catégories?.length) {
        setValue("catégories", [
          { nom: "ouv", écarts: null },
          { nom: "emp", écarts: null },
          { nom: "tam", écarts: null },
          { nom: "ic", écarts: null },
        ]);
      }
    }
  }, [setValue, catégories, estCalculable]);

  useEffect(() => {
    if (résultat !== undefined) {
      if (résultat !== null) {
        const note = computeIndicator2Note(résultat);
        setValue("note", note);
      }

      // If it is a compensation, we set the note to the max value.
      if (estUnRattrapage) setValue("note", indicatorNoteMax[stepName]);

      if (résultat === 0 || résultat === null) {
        setPopulationFavorableDisabled(true);
        setValue("populationFavorable", "");
      } else {
        setPopulationFavorableDisabled(false);
      }
    }
  }, [estUnRattrapage, résultat, setValue]);

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
        <ClientAnimate>
          <RadioOuiNon
            legend="L'indicateur sur l'écart de taux d'augmentations individuelles (hors promotion) est-il calculable ?"
            name="estCalculable"
          />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "non" && <MotifNC stepName={stepName} />}

            {estCalculable === "oui" && (
              <>
                <p>
                  <strong>Écarts de taux d’augmentations par CSP en %</strong>
                </p>

                <p>
                  Les écarts de taux d’augmentations sont à renseigner uniquement pour les CSP pris en compte pour le
                  calcul (zéro signifiant qu'il n'y a pas d'écart entre les femmes et les hommes). Un écart positif est
                  à la faveur des hommes et un écart négatif est à la faveur des femmes.
                </p>

                <PercentageInput label="Ouvriers" name="catégories.0.écarts" />
                <PercentageInput label="Employés" name="catégories.1.écarts" />
                <PercentageInput label="Techniciens et agents de maîtrise" name="catégories.2.écarts" />
                <PercentageInput label="Ingénieurs et cadres" name="catégories.3.écarts" />

                <br />

                <PercentageInput label="Résultat final en %" name="résultat" min={0} />

                <PopulationFavorable disabled={populationFavorableDisabled} />

                {note !== undefined && (
                  <>
                    <IndicatorNote
                      note={note}
                      max={indicatorNoteMax[stepName]}
                      text="Nombre de points obtenus à l'indicateur"
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
