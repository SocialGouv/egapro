"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { IndicateurDeuxComputer } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { zodNumberOrEmptyString } from "@common/utils/form";
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
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import {
  MANDATORY_FAVORABLE_POPULATION,
  MANDATORY_RESULT,
  NOT_ALL_EMPTY_CATEGORIES,
  NOT_BELOW_0,
} from "../../../messages";
import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "augmentations";

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
      note: z.number(),
      catégories: z.object({
        [CSP.Enum.OUVRIERS]: zodNumberOrEmptyString,
        [CSP.Enum.EMPLOYES]: zodNumberOrEmptyString,
        [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: zodNumberOrEmptyString,
        [CSP.Enum.INGENIEURS_CADRES]: zodNumberOrEmptyString,
      }),
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
      if (value.résultat !== 0 && !value.populationFavorable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: MANDATORY_FAVORABLE_POPULATION,
          path: ["populationFavorable"],
        });
      }

      if (Object.values(value.catégories).every(val => val === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: NOT_ALL_EMPTY_CATEGORIES,
          path: ["catégories"],
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

export const AugmentationsForm = () => {
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
    handleSubmit,
    formState: { isValid, errors: _errors, dirtyFields },
    setValue,
    getValues,
    watch,
  } = methods;

  // For some obscure reasons, résultat can be undefined on some render, before to become eventually "" or a number.
  // This provokes a bug, because it is responsible to display populationFavorable, which becomes null and makes isValid false...
  const résultat = watch("résultat") || getValues("résultat");
  const note = watch("note");
  const estCalculable = watch("estCalculable");
  const populationFavorable = watch("populationFavorable");

  const estUnRattrapage =
    formData["remunerations-resultat"]?.populationFavorable &&
    populationFavorable &&
    formData["remunerations-resultat"]?.populationFavorable !== populationFavorable;

  useEffect(() => {
    if (résultat !== undefined) {
      if (résultat !== "") {
        const note = new IndicateurDeuxComputer(new IndicateurUnComputer()).computeNote(résultat);
        setValue("note", note, { shouldValidate: true });
      }
      //If it is a compensation, we set the note to the max value.
      if (estUnRattrapage) setValue("note", indicatorNoteMax[stepName], { shouldValidate: true });
    }
  }, [estUnRattrapage, résultat, setValue]);

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

                <PercentageInput<FormType> label="Ouvriers" name={`catégories.${CSP.Enum.OUVRIERS}`} />
                <PercentageInput<FormType> label="Employés" name={`catégories.${CSP.Enum.EMPLOYES}`} />
                <PercentageInput<FormType>
                  label="Techniciens et agents de maîtrise"
                  name={`catégories.${CSP.Enum.TECHNICIENS_AGENTS_MAITRISES}`}
                />
                <PercentageInput<FormType>
                  label="Ingénieurs et cadres"
                  name={`catégories.${CSP.Enum.INGENIEURS_CADRES}`}
                />

                <br />

                <PercentageInput<FormType>
                  label="Résultat final obtenu à l'indicateur en %"
                  name="résultat"
                  min={0}
                  hintText={
                    "(il s'agit de la valeur absolue de l’écart global de taux d’augmentations, arrondie à la première décimale.)"
                  }
                />

                {/* Don't forget that résultat can be undefined, for some reasons. */}
                {/* We must handle this case, because of shouldUnregister mode. */}
                {/* Try with a résultat of 0 and go back to this screen. */}
                {résultat !== 0 && résultat !== "" && résultat !== undefined && <PopulationFavorable />}

                {note !== undefined && isValid && (
                  <>
                    <IndicatorNoteInput
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
