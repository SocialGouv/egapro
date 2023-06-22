"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import { config } from "@common/config";
import { zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { ClientOnly } from "@components/ClientOnly";
import { RadioOuiNon } from "@components/next13/RadioOuiNon";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { pick } from "lodash";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

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

/**
 * The shape of data depends of some conditions on fields. We ensure to always have the correct shape depending on the context.
 */
const formatData = (data: FormType): DeclarationFormState["rémunérations"] => {
  let result;

  if (data.estCalculable === "non") {
    result = pick(data, "estCalculable", "déclarationCalculCSP", "motifNonCalculabilité");
  } else if (data.mode === "csp") {
    result = pick(data, "estCalculable", "mode");
  } else if (data.cse === "oui") {
    result = pick(data, "estCalculable", "mode", "cse", "dateConsultationCSE");
  } else {
    result = pick(data, "estCalculable", "mode", "cse");
  }

  return result as DeclarationFormState["rémunérations"]; // Fix limit of pick which can't infer that estCalculable is always present.
};

export const RemunerationForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: formData.rémunérations,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = methods;

  const estCalculable = watch("estCalculable");
  const mode = watch("mode");
  const cse = watch("cse");
  const déclarationCalculCSP = watch("déclarationCalculCSP");

  const onSubmit = async (data: FormType) => {
    savePageData("rémunérations", formatData(data));

    if (estCalculable === "non") {
      if (formData.entreprise?.tranche === "50:250") {
        return router.push(`${config.base_declaration_url}/augmentations-et-promotions`);
      } else {
        return router.push(`${config.base_declaration_url}/augmentations`);
      }
    }

    router.push(`${config.base_declaration_url}/${mode === "csp" ? "remuneration-csp" : "remuneration-coefficient"}`);
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
                  <option value="egvi40pcet">Effectif des groupes valides inférieur à 40% de l'effectif total</option>
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

              {mode !== "csp" && (
                <>
                  <RadioButtons
                    legend="Un CSE a-t-il été mis en place ?"
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
                      state={errors.dateConsultationCSE ? "error" : "default"}
                      stateRelatedMessage={errors.dateConsultationCSE?.message}
                    />
                  )}
                </>
              )}
            </>
          )}
        </ClientOnly>

        <ButtonsGroup
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              children: "Précédent",
              priority: "secondary",
              onClick: () => router.push(`${config.base_declaration_url}/periode-reference`),
              type: "button",
            },
            {
              children: "Suivant",
              type: "submit",
              nativeButtonProps: {
                disabled: !isValid,
              },
            },
          ]}
        />
      </form>
    </FormProvider>
  );
};
