"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { IndicateurCinqComputer } from "@common/core-domain/computers/IndicateurCinqComputer";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { zodNumberOrEmptyString } from "@common/utils/form";
import { IndicatorNoteInput } from "@components/RHF/IndicatorNoteInput";
import { PopulationFavorable } from "@components/RHF/PopulationFavorable";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { produce } from "immer";
import { get } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import {
  MANDATORY_FAVORABLE_POPULATION,
  MANDATORY_RESULT,
  NOT_BELOW_0,
  NOT_HIGHER_THAN_N_RESULT,
} from "../../../messages";
import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = z
  .object({
    populationFavorable: z.string().optional(),
    résultat: zodNumberOrEmptyString, // Infered as number | string for usage in this React Component (see below).
    note: z.number().optional(),
  })
  .superRefine(({ résultat, populationFavorable }, ctx) => {
    if (résultat === "") {
      // But it won't accept an empty string thanks to superRefine rule.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: MANDATORY_RESULT,
        path: ["résultat"],
      });
    } else if (résultat < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: NOT_BELOW_0,
        path: ["résultat"],
      });
    } else if (résultat > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: NOT_HIGHER_THAN_N_RESULT(5),
        path: ["résultat"],
      });
    } else if (résultat !== 5 && !populationFavorable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: MANDATORY_FAVORABLE_POPULATION,
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

  const methods = useForm<FormType>({
    mode: "onChange",
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    watch,
  } = methods;

  const résultat = watch("résultat");
  const note = watch("note");

  useEffect(() => {
    if (résultat !== "") {
      const note = new IndicateurCinqComputer().computeNote(résultat);
      setValue("note", note);
    }
  }, [résultat, setValue]);

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
                    setValueAs: (value: string | null) => {
                      // We implement our own valueAsNumber because valueAsNumber returns NaN for empty string and we want null instead for consistency.
                      if (value === null) return null;
                      const num = Number(value);
                      return isNaN(num) || value === "" ? null : num;
                    },
                  }),
                }}
                state={get(errors, "résultat") && "error"}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                stateRelatedMessage={get(errors, "résultat")?.message || ""}
              />

              {résultat !== 5 && <PopulationFavorable legend="Sexe des salariés sur-représentés" />}

              {note !== undefined && (
                <>
                  <IndicatorNoteInput
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
