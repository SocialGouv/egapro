"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  computeIndicator2And3Note,
  indicatorNoteMax,
} from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodNumberOrNaNOrNull, zodRadioInputSchema } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { MotifNC } from "@components/RHF/MotifNC";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { IndicatorNote } from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
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
    populationFavorable: z.string().optional(),
    résultat: zodNumberOrNaNOrNull.optional(),
    résultatEquivalentSalarié: zodNumberOrNaNOrNull.optional(),
    note: z.number().optional(),
    notePourcentage: z.number().optional(),
    noteNombreSalaries: z.number().optional(),
  })
  .superRefine(({ estCalculable, résultat, résultatEquivalentSalarié, populationFavorable }, ctx) => {
    if (estCalculable === "oui" && (résultat !== 0 || résultatEquivalentSalarié !== 0) && !populationFavorable) {
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
  const router = useRouter();
  const [animationParent] = useAutoAnimate<HTMLDivElement>();
  const { formData, saveFormData } = useDeclarationFormManager();

  const [populationFavorableDisabled, setPopulationFavorableDisabled] = useState<boolean>();

  const methods = useForm<FormType>({
    shouldUnregister: true,
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.debug("formData", data);
      // console.debug("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },
    mode: "onChange",
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    formState: { isValid, errors: _errors },
    setValue,
    unregister,
    watch,
  } = methods;

  const estCalculable = watch("estCalculable");
  const résultat = watch("résultat");
  const résultatEquivalentSalarié = watch("résultatEquivalentSalarié");
  const note = watch("note");
  const notePourcentage = watch("notePourcentage");
  const populationFavorable = watch("populationFavorable");
  const noteNombreSalaries = watch("noteNombreSalaries");

  const estUnRattrapage =
    formData["remunerations-resultat"]?.populationFavorable &&
    populationFavorable &&
    formData["remunerations-resultat"]?.populationFavorable !== populationFavorable;

  // Sync notes and populationFavorable with result fields.
  useEffect(() => {
    let notePourcentage, noteNombreSalaries;
    if (résultat !== undefined && résultat !== null) {
      notePourcentage = computeIndicator2And3Note(résultat);
      setValue("notePourcentage", notePourcentage);
    }
    if (résultatEquivalentSalarié !== undefined && résultatEquivalentSalarié !== null) {
      noteNombreSalaries = computeIndicator2And3Note(résultatEquivalentSalarié);
      setValue("noteNombreSalaries", noteNombreSalaries);
    }
    if (notePourcentage !== undefined && noteNombreSalaries !== undefined) {
      setValue("note", Math.max(notePourcentage, noteNombreSalaries));
    }

    // If it is a compensation, we set the note to the max value.
    if (estUnRattrapage) setValue("note", indicatorNoteMax[stepName]);

    if (résultat === 0 && résultatEquivalentSalarié === 0) {
      setPopulationFavorableDisabled(true);
      setValue("populationFavorable", "");
    } else {
      setPopulationFavorableDisabled(false);
    }

    // RHF recommends to register before using setValue. Seems to work without it though.
    if (estCalculable === "non") {
      unregister("notePourcentage");
      unregister("noteNombreSalaries");
      unregister("note");
    } else if (estCalculable === "oui") {
      register("notePourcentage");
      register("noteNombreSalaries");
      register("note");
    }
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
      draft[stepName] = data as DeclarationFormState[typeof stepName];
    });

    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* <ReactHookFormDebug /> */}

        <div ref={animationParent}>
          {/* Needs to be outside ClientOnly to not be unregistered by RHF. Be careful! */}
          <RadioOuiNon
            legend="L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ?"
            name="estCalculable"
          />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "non" && (
              <>
                <MotifNC stepName={stepName} />
              </>
            )}

            {estCalculable === "oui" && (
              <>
                <PercentageInput label="Résultat final en %" name="résultat" min={0} />

                <PercentageInput
                  label="Résultat final en nombre équivalent de salariés"
                  name="résultatEquivalentSalarié"
                  min={0}
                />

                <PopulationFavorable disabled={populationFavorableDisabled} />

                {notePourcentage !== undefined && (
                  <IndicatorNote
                    note={notePourcentage}
                    max={indicatorNoteMax[stepName]}
                    text="Nombre de points obtenus sur le résultat final en %"
                  />
                )}

                {noteNombreSalaries !== undefined && (
                  <IndicatorNote
                    note={noteNombreSalaries}
                    max={indicatorNoteMax[stepName]}
                    text="Nombre de points obtenus sur le résultat final en nombre équivalent de salariés"
                    className={fr.cx("fr-mt-2w")}
                  />
                )}

                {note !== undefined && (
                  <>
                    <IndicatorNote
                      note={note}
                      max={indicatorNoteMax[stepName]}
                      text="Nombre de points obtenus à l'indicateur"
                      className={fr.cx("fr-mt-2w")}
                    />

                    {estUnRattrapage && (
                      <Alert
                        severity="info"
                        title=""
                        description="Le nombre de points obtenus à l'indicateur est maximal car il y a une politique de rattrapage vis à vis de l'indicateur rémunérations."
                        className={fr.cx("fr-mt-2w")}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </div>
      </form>
    </FormProvider>
  );
};
