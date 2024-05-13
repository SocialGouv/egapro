"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { MotifNC } from "@components/RHF/MotifNC";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { getModifiedFormValues } from "@components/utils/getModifiedFormValues";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { isBefore, parseISO } from "date-fns";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const MIN_DATE_CSE = "2018-01-01";

const formSchema = zodFr
  .discriminatedUnion("estCalculable", [
    zodFr.object({
      estCalculable: z.literal("non"),
      motifNonCalculabilité: z.string(),
      déclarationCalculCSP: z.boolean(),
    }),
    zodFr.object({
      estCalculable: z.literal("oui"),
      mode: z.string(), // No check is necessary as the value is from select options.
      cse: zodRadioInputSchema.nullish(), // May be null if declaration is for UES and for CSP mode.
      dateConsultationCSE: zodDateSchema
        .superRefine((date, ctx) => {
          if (isBefore(parseISO(date), parseISO(MIN_DATE_CSE))) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "La date doit être postérieure ou égale à 2018",
            });
          }
        })
        .optional(),
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
        if (value.cse === "oui" && !value.dateConsultationCSE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Obligatoire",
            path: ["dateConsultationCSE"],
          });
        }
        break;
      }
    }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;
type FormTypeWhenCalculable = Extract<FormType, { estCalculable: "oui" }>;
type FormTypeWhenNonCalculable = Extract<FormType, { estCalculable: "non" }>;

const stepName: FunnelKey = "remunerations";

export const RemunerationForm = () => {
  const router = useRouter();
  const { formData, saveFormData, savePageData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  const methods = useForm<FormType>({
    mode: "onChange",
    shouldUnregister: true, // Don't store the fields that are not displayed.
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, dirtyFields },
  } = methods;

  const estCalculable = watch("estCalculable");
  const mode = watch("mode");
  const cse = watch("cse", (formData[stepName]?.estCalculable === "oui" && formData[stepName].cse) || undefined); // Need to add a default value explicitly to fix bug on date not displayed. (bug #1731)
  const déclarationCalculCSP = watch("déclarationCalculCSP");

  useEffect(() => {
    if (mode && ["niveau_branche", "niveau_autre"].includes(mode) && formData.ues?.nom) {
      // CSE question is implicitly yes for UES in mode "niveau_branche" or "niveau_autre".
      setValue("cse", "oui");
    }
  }, [formData, mode, setValue]);

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      // We clean if user has switched between modes.
      if (data.estCalculable === "oui") {
        const selectedMode =
          data.mode === "csp"
            ? "remunerations-csp"
            : mode === "niveau_branche"
              ? "remunerations-coefficient-branche"
              : "remunerations-coefficient-autre";

        const formStateStepToRemove = (
          ["remunerations-coefficient-autre", "remunerations-coefficient-branche", "remunerations-csp"] as const
        ).filter(mode => mode !== selectedMode);

        formStateStepToRemove.forEach(mode => {
          draft[mode] = undefined;
        });
      }

      //FIXME: changing estCalculable to non on modified déclaration desyncs remunerations-resultat
      if (data.estCalculable === "non") {
        draft["remunerations-resultat"] = undefined;
        savePageData("remunerations-resultat", undefined);
      }
      if (data.estCalculable === "oui" && formData[stepName]?.estCalculable === "non") {
        draft["remunerations-resultat"] = undefined;
        savePageData("remunerations-resultat", undefined);
      }
      if (data.estCalculable !== formData[stepName]?.estCalculable) {
        draft[stepName] = getModifiedFormValues(dirtyFields, data) as DeclarationDTO[typeof stepName];
      } else {
        draft[stepName] = data as DeclarationDTO[typeof stepName];
      }
    });
    saveFormData(newFormData);

    return router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  const errorsWhenCalculable = errors as FieldErrors<FormTypeWhenCalculable>;
  const errorsWhenNonCalculable = errors as FieldErrors<FormTypeWhenNonCalculable>;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
        <ClientAnimate>
          <RadioOuiNon legend="L’indicateur sur l’écart de rémunération est-il calculable ? *" name="estCalculable" />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "non" && (
              <>
                <Checkbox
                  options={[
                    {
                      label:
                        "Je déclare avoir procédé au calcul de cet indicateur par catégorie socio-professionnelle, et confirme que l'indicateur n'est pas calculable. *",
                      nativeInputProps: register("déclarationCalculCSP"),
                    },
                  ]}
                  state={errorsWhenNonCalculable.déclarationCalculCSP && "error"}
                  stateRelatedMessage={errorsWhenNonCalculable.déclarationCalculCSP?.message}
                />

                {déclarationCalculCSP && <MotifNC stepName={stepName} />}
              </>
            )}
          </ClientOnly>
          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {estCalculable === "oui" && (
              <>
                <RadioButtons
                  legend={`Modalité choisie pour le calcul de l'indicateur sur l'écart de rémunération *`}
                  options={[
                    {
                      label: "Par catégorie socio-professionnelle",
                      nativeInputProps: {
                        value: "csp",
                        ...register("mode"),
                      },
                    },
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
                  ]}
                />

                {mode && mode !== "csp" && (
                  <>
                    {formData.ues?.nom ? (
                      // The cse field is implicitly yes for UES declaration.
                      <input {...register(`cse`, { value: "oui" })} type="hidden" />
                    ) : (
                      <RadioOuiNon
                        legend="Un CSE a-t-il été mis en place ?"
                        name="cse"
                        disabled={!!formData.ues?.nom}
                      />
                    )}

                    {cse === "oui" && (
                      <Input
                        label="Date de consultation du CSE pour le choix de cette modalité de calcul"
                        nativeInputProps={{
                          ...register("dateConsultationCSE"),
                          type: "date",
                          min: MIN_DATE_CSE,
                        }}
                        state={errorsWhenCalculable.dateConsultationCSE && "error"}
                        stateRelatedMessage={errorsWhenCalculable.dateConsultationCSE?.message}
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
