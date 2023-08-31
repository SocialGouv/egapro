"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import {
  computeIndicator5Note,
  indicatorNoteMax,
} from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodPositiveOrZeroIntegerSchema } from "@common/utils/form";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { IndicatorNote } from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { produce } from "immer";
import { get } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = z
  .object({
    populationFavorable: z.string(),
    résultat: zodPositiveOrZeroIntegerSchema
      .min(0, { message: "La valeur minimale est 0" })
      .max(5, { message: "La valeur maximale est 5" }),
    note: z.number().optional(),
  })
  .superRefine(({ résultat, populationFavorable }, ctx) => {
    if (résultat !== 5 && !populationFavorable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La population envers laquelle l'écart est favorable est obligatoire",
        path: ["populationFavorable"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "hautes-remunerations";

export const HautesRémunérationsForm = () => {
  const router = useRouter();
  const [animationParent] = useAutoAnimate();
  const { formData, saveFormData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  const [populationFavorableDisabled, setPopulationFavorableDisabled] = useState<boolean>();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    watch,
  } = methods;

  useEffect(() => {
    register("note");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const résultat = watch("résultat");
  const note = watch("note");

  useEffect(() => {
    if (résultat !== undefined) {
      const note = computeIndicator5Note(résultat);
      setValue("note", note);
    }
    if (résultat === 5) {
      setPopulationFavorableDisabled(true);
      setValue("populationFavorable", "");
    } else {
      setPopulationFavorableDisabled(false);
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
        <div ref={animationParent}>
          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            <>
              <Input
                label="Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté"
                nativeInputProps={{
                  type: "number",
                  min: 0,
                  max: 5,
                  step: 1,
                  ...register("résultat", {
                    valueAsNumber: true,
                    // setValueAs: (value: string) => {
                    //   // We implement our own valueAsNumber because valueAsNumber returns NaN for empty string and we want null instead.
                    //   const num = Number(value);
                    //   return isNaN(num) || value === "" ? null : num;
                    // },
                  }),
                }}
                state={get(errors, "résultat") && "error"}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                stateRelatedMessage={get(errors, "résultat")?.message || ""}
              />

              <PopulationFavorable legend="Sexe des salariés sur-représentés" disabled={populationFavorableDisabled} />

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
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </div>
      </form>
    </FormProvider>
  );
};
