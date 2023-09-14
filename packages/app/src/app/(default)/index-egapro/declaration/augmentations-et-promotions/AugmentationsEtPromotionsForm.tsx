"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  computeIndicator2And3Note,
  indicatorNoteMax,
} from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
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
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

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
      résultat: z.number({ invalid_type_error: "Le résultat est obligatoire" }).nonnegative(),
      résultatEquivalentSalarié: z.number({ invalid_type_error: "Le résultat est obligatoire" }).nonnegative(),
      note: z.number().optional(),
      notePourcentage: z.number().optional(),
      noteNombreSalaries: z.number().optional(),
    }),
  ])
  .superRefine((value, ctx) => {
    if (value.estCalculable === "oui") {
      if ((value.résultat !== 0 || value.résultatEquivalentSalarié !== 0) && !value.populationFavorable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La population envers laquelle l'écart est favorable est obligatoire",
          path: ["populationFavorable"],
        });
      }
    }
  });

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "augmentations-et-promotions";

export const AugmentationEtPromotionsForm = () => {
  const router = useRouter();
  const { formData, saveFormData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  const [populationFavorableDisabled, setPopulationFavorableDisabled] = useState<boolean>();

  const methods = useForm<FormType>({
    mode: "onChange",
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    formState: { isValid },
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
      draft[stepName] = data as DeclarationDTO[typeof stepName];
    });
    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientAnimate>
          {/* Needs to be outside ClientOnly to not be unregistered by RHF. Be careful! */}
          <RadioOuiNon
            legend="L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ?"
            name="estCalculable"
          />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "non" && <MotifNC stepName={stepName} />}

            {estCalculable === "oui" && (
              <>
                <PercentageInput<FormType> label="Résultat final obtenu à l'indicateur en %" name="résultat" min={0} />

                <PercentageInput<FormType>
                  label="Résultat final obtenu à l'indicateur en nombre équivalent de salariés"
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
