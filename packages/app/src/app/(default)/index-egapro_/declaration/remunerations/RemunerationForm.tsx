"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState, labelsMotifNC, motifsNC } from "@services/form/declaration/DeclarationFormBuilder";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = z
  .object({
    estCalculable: zodRadioInputSchema,
    mode: z.string().optional(), // No check is necessary as the value is from select options.
    cse: zodRadioInputSchema.nullish(),
    dateConsultationCSE: zodDateSchema.optional(),
    déclarationCalculCSP: z.boolean().optional(),
    motifNonCalculabilité: z.string().optional(),
  })
  .superRefine(({ cse, estCalculable, déclarationCalculCSP, mode, motifNonCalculabilité }, ctx) => {
    switch (estCalculable) {
      case "non": {
        if (!déclarationCalculCSP) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La confirmation du calcul par CSP est obligatoire",
            path: ["déclarationCalculCSP"],
          });
        } else if (déclarationCalculCSP === true && !motifNonCalculabilité) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le motif de non calculabilité est obligatoire",
            path: ["motifNonCalculabilité"],
          });
        }
        break;
      }
      case "oui": {
        if (!mode) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le mode de calcul est obligatoire",
            path: ["mode"],
          });
        } else if (mode !== "csp" && !cse) {
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
  const { formData, saveFormData } = useDeclarationFormManager();
  const router = useRouter();

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
                state={errors.déclarationCalculCSP ? "error" : "default"}
                stateRelatedMessage={errors.déclarationCalculCSP?.message}
              />

              {déclarationCalculCSP && (
                <Select
                  label="Précision du motif de non calculabilité de l'indicateur"
                  nativeSelectProps={{ ...register("motifNonCalculabilité") }}
                  state={errors.motifNonCalculabilité ? "error" : "default"}
                  stateRelatedMessage={errors.motifNonCalculabilité?.message}
                >
                  <option value="" disabled hidden>
                    Selectionnez une option
                  </option>

                  {motifsNC["remunerations"].map(motif => (
                    <option key={motif} value={motif}>
                      {labelsMotifNC[motif]}
                    </option>
                  ))}
                </Select>
              )}
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
                      state={errors.dateConsultationCSE ? "error" : "default"}
                      stateRelatedMessage={errors.dateConsultationCSE?.message}
                    />
                  )}
                </>
              )}
            </>
          )}
        </ClientOnly>

        <BackNextButtons stepName={stepName} disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
