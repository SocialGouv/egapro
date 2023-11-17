"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { IndicateurQuatreComputer } from "@common/core-domain/computers/IndicateurQuatreComputer";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { zodFr } from "@common/utils/zod";
import { IndicatorNoteInput } from "@components/RHF/IndicatorNoteInput";
import { MotifNC } from "@components/RHF/MotifNC";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { MANDATORY_RESULT, NOT_BELOW_0, NOT_HIGHER_THAN_N } from "../../../messages";
import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.discriminatedUnion("estCalculable", [
  zodFr.object({
    estCalculable: z.literal("non"),
    motifNonCalculabilité: z.string(),
  }),
  zodFr.object({
    estCalculable: z.literal("oui"),
    résultat: z
      .number({ invalid_type_error: MANDATORY_RESULT })
      .nonnegative(NOT_BELOW_0)
      .lte(100, NOT_HIGHER_THAN_N(100) + "%"),
    note: z.number().optional(),
  }),
]);

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "conges-maternite";

export const CongesMaterniteForm = () => {
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
    setValue,
    formState: { isValid, errors: _errors },
    watch,
  } = methods;

  const résultat = watch("résultat");
  const note = watch("note");
  const estCalculable = watch("estCalculable");

  useEffect(() => {
    if (résultat !== null && résultat !== undefined) {
      const resultAsFloat = Math.floor(résultat / 100);
      const note = new IndicateurQuatreComputer().computeNote(resultAsFloat);
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
        <ClientAnimate>
          <RadioOuiNon legend="L'indicateur est-il calculable ?" name="estCalculable" />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable && (
              <>
                {estCalculable === "non" ? (
                  <>
                    <MotifNC stepName={stepName} />
                  </>
                ) : (
                  <>
                    <PercentageInput<FormType>
                      label="Résultat final obtenu à l'indicateur en %"
                      name="résultat"
                      min={0}
                      max={100}
                    />

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
