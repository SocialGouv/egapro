"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { MotifNC } from "@components/RHF/MotifNC";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
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

const formSchema = zodFr
  .discriminatedUnion("estCalculable", [
    zodFr.object({
      estCalculable: z.literal("non"),
      motifNonCalculabilité: z.string(),
      déclarationCalculCSP: z.boolean(),
    }),
    zodFr.object({
      estCalculable: z.literal("oui"),
      mode: z.string().optional(), // No check is necessary as the value is from select options.
      cse: zodRadioInputSchema.nullish(),
      dateConsultationCSE: zodDateSchema,
    }),
  ])
  .superRefine((value, ctx) => {
    switch (value.estCalculable) {
      case "non": {
        if (!value.déclarationCalculCSP) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La confirmation du calcul par CSP est obligatoire",
            path: ["déclarationCalculCSP"],
          });
        } else if (value.déclarationCalculCSP === true && !value.motifNonCalculabilité) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le motif de non calculabilité est obligatoire",
            path: ["motifNonCalculabilité"],
          });
        }
        break;
      }
      case "oui": {
        if (!value.mode) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le mode de calcul est obligatoire",
            path: ["mode"],
          });
        } else if (value.mode !== "csp" && !value.cse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Obligatoire",
            path: ["cse"],
          });
        }
        break;
      }
    }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;
1;

const stepName: FunnelKey = "remunerations";

export const RemunerationForm = () => {
  const router = useRouter();
  const { formData, saveFormData } = useDeclarationFormManager();

  const methods = useForm<FormType>({
    shouldUnregister: true, // Don't store the fields that are not displayed.
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = methods;

  const estCalculable = watch("estCalculable");
  const mode = watch("mode");
  const cse = watch("cse");
  const déclarationCalculCSP = watch("déclarationCalculCSP");

  useEffect(() => {
    if (mode && ["niveau_branche", "niveau_autre"].includes(mode) && formData.ues?.nom) {
      // CSE question is implicitly yes for UES in mode "niveau_branche" or "niveau_autre".
      setValue("cse", "oui");
    }
  }, [formData, mode, setValue]);

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      draft[stepName] = data as DeclarationFormState[typeof stepName];
    });

    saveFormData(newFormData);

    return router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* <ReactHookFormDebug /> */}

        <ClientAnimate>
          <RadioOuiNon legend="L’indicateur sur l’écart de rémunération est-il calculable ?" name="estCalculable" />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "non" && (
              <>
                <Checkbox
                  options={[
                    {
                      label:
                        "Je déclare avoir procédé au calcul de cet indicateur par catégorie socio-professionnelle, et confirme que l'indicateur n'est pas calculable.",
                      nativeInputProps: {
                        ...register("déclarationCalculCSP"),
                      },
                    },
                  ]}
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  state={errors.déclarationCalculCSP ? "error" : "default"}
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  stateRelatedMessage={errors.déclarationCalculCSP?.message}
                />

                {déclarationCalculCSP && <MotifNC stepName={stepName} />}
              </>
            )}
          </ClientOnly>
          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "oui" && (
              <>
                <RadioButtons
                  legend={`Modalité choisie pour le calcul de l'indicateur sur l'écart de rémunération`}
                  options={[
                    {
                      label: "Par niveau ou coefficient hiérarchique en application de la classification de branche",
                      nativeInputProps: {
                        value: "niveau_branche",
                        ...register("mode"),
                      },
                    },
                    {
                      label:
                        "Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
                      nativeInputProps: {
                        value: "niveau_autre",
                        ...register("mode"),
                      },
                    },
                    {
                      label: "Par catégorie socio-professionnelle",
                      nativeInputProps: {
                        value: "csp",
                        ...register("mode"),
                      },
                    },
                  ]}
                />

                {mode && mode !== "csp" && (
                  <>
                    <RadioButtons
                      legend="Un CSE a-t-il été mis en place ?"
                      disabled={!!formData.ues?.nom}
                      options={[
                        {
                          label: "Oui",
                          nativeInputProps: {
                            value: "oui",
                            ...register("cse"),
                          },
                        },
                        {
                          label: "Non",
                          nativeInputProps: {
                            value: "non",
                            ...register("cse"),
                          },
                        },
                      ]}
                      orientation="horizontal"
                    />
                    {cse === "oui" && (
                      <Input
                        label="Date de consultation du CSE pour le choix de cette modalité de calcul"
                        nativeInputProps={{
                          type: "date",
                          ...register("dateConsultationCSE"),
                        }}
                        iconId="ri-calendar-line"
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        state={errors.dateConsultationCSE ? "error" : "default"}
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        stateRelatedMessage={errors.dateConsultationCSE?.message}
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
