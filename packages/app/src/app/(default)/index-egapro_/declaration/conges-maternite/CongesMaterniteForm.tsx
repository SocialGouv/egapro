"use client";

import { fr } from "@codegouvfr/react-dsfr";
import {
  computeIndicator4Note,
  indicatorNoteMax,
} from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodNumberOrNaNOrNull } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { MotifNC } from "@components/RHF/MotifNC";
import { PercentageInput } from "@components/RHF/PercentageInput";
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
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.discriminatedUnion("estCalculable", [
  zodFr.object({
    estCalculable: z.literal("non"),
    motifNonCalculabilité: z.string(),
  }),
  zodFr.object({
    estCalculable: z.literal("oui"),
    résultat: zodNumberOrNaNOrNull.optional(),
    note: z.number().optional(),
  }),
]);

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "conges-maternite";

export const CongesMaterniteForm = () => {
  const router = useRouter();
  const [animationParent] = useAutoAnimate();
  const { formData, saveFormData } = useDeclarationFormManager();

  const methods = useForm<FormType>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.debug("formData", data);
      console.debug("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },
    mode: "onChange",
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid, errors: _errors },
    watch,
  } = methods;

  const résultat = watch("résultat");
  const note = watch("note");
  const estCalculable = watch("estCalculable");

  useEffect(() => {
    register("note");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (résultat) {
      const note = computeIndicator4Note(résultat);
      setValue("note", note);
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
        {/* <ReactHookFormDebug /> */}

        <div ref={animationParent}>
          <RadioOuiNon
            legend="L'indicateur sur l'écart de taux d'augmentations individuelles est-il calculable ?"
            name="estCalculable"
          />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable && (
              <>
                {estCalculable === "non" ? (
                  <>
                    <MotifNC stepName={stepName} />
                  </>
                ) : (
                  <>
                    <PercentageInput label="Résultat final en %" name="résultat" min={0} max={100} />

                    {note !== undefined && (
                      <>
                        <IndicatorNote
                          note={note}
                          max={indicatorNoteMax[stepName]}
                          text="Nombre de points obtenus à l'indicateur"
                          className={fr.cx("fr-mt-2w")}
                        />
                      </>
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
