"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import { config } from "@common/config";
import { zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { RadioOuiNon } from "@components/next13/RadioOuiNon";
import { ButtonAsLink } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    estCalculable: zodRadioInputSchema,
    modalité: z.string().optional(), // No check is necessary as the value is from select options.
    cse: zodRadioInputSchema.optional(),
    dateConsultationCSE: zodDateSchema.optional(),
    déclarationCalculCSP: z.boolean().optional(),
    motifNC: z.string().optional(),
  })
  .superRefine(({ estCalculable, déclarationCalculCSP, motifNC }, ctx) => {
    if (estCalculable === "non" && déclarationCalculCSP !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La confirmation du calcul par CSP est obligatoire",
        path: ["déclarationCalculCSP"],
      });
    }

    if (déclarationCalculCSP === true && !motifNC) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le motif de non calculabilité est obligatoire",
        path: ["motifNC"],
      });
    }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;
1;

export const RemunerationCSPForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      estCalculable: formData.rémunérations?.estCalculable,
      modalité: formData.rémunérations?.mode,
      cse: formData.rémunérations?.cse,
      dateConsultationCSE: formData.rémunérations?.dateConsultationCSE,
      déclarationCalculCSP: formData.rémunérations?.déclarationCalculCSP,
      motifNC: formData.rémunérations?.motifNonCalculabilité,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = methods;

  const estCalculable = watch("estCalculable");
  const modalité = watch("modalité");
  const cse = watch("cse");
  const déclarationCalculCSP = watch("déclarationCalculCSP");

  const onSubmit = async (data: FormType) => {
    // savePageData("rémunérationsCSP", data as DeclarationFormState["rémunérationsCSP"]);
    router.push(`${config.base_declaration_url}/remuneration-resultat`);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* <ReactHookFormDebug /> */}

        <RadioOuiNon legend="L’indicateur sur l’écart de rémunération est-il calculable ?" name="estCalculable" />

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
                nativeSelectProps={{ ...register("motifNC") }}
                state={errors.motifNC ? "error" : "default"}
                stateRelatedMessage={errors.motifNC?.message}
              >
                <option value="" disabled hidden>
                  Selectionnez une option
                </option>
                <option value="egvi40pcet">Effectif des groupes valides inférieur à 40% de l'effectif total</option>
              </Select>
            )}
          </>
        )}
        {estCalculable === "oui" && (
          <>
            <RadioButtons
              legend={`Modalité choisie pour le calcul de l'indicateur sur l'écart de rémunération`}
              options={[
                {
                  label: "Par niveau ou coefficient hiérarchique en application de la classification de branche",
                  nativeInputProps: {
                    value: "niveau_branche",
                    ...register("modalité"),
                  },
                },
                {
                  label:
                    "Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
                  nativeInputProps: {
                    value: "niveau_autre",
                    ...register("modalité"),
                  },
                },
                {
                  label: "Par catégorie socio-professionnelle",
                  nativeInputProps: {
                    value: "csp",
                    ...register("modalité"),
                  },
                },
              ]}
            />

            {modalité !== "csp" && (
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
        <div style={{ display: "flex", gap: 10 }} className={fr.cx("fr-mt-4w")}>
          <ButtonAsLink href={`${config.base_declaration_url}/remuneration`} variant="secondary">
            Précédent
          </ButtonAsLink>

          <Button>Suivant</Button>
        </div>
      </form>
    </FormProvider>
  );
};
