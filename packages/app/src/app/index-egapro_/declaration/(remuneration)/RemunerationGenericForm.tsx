"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { config } from "@common/config";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { zodRealIntegerSchema } from "@common/utils/form";
import { ClientOnly } from "@components/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type Catégorie, type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { get } from "lodash";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  catégories: z.array(
    z.object({
      nom: z.string(),
      tranches: z.object({
        ":29": zodRealIntegerSchema,
        "30:39": zodRealIntegerSchema,
        "40:49": zodRealIntegerSchema,
        "50:": zodRealIntegerSchema,
      }),
    }),
  ),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const defaultTranch = { ":29": 0, "30:39": 0, "40:49": 0, "50:": 0 };

const buildDefaultCategories = (mode: "coefficient" | "csp") =>
  mode === "csp"
    ? {
        catégories: [
          { nom: "ouv", tranches: { ...defaultTranch } },
          { nom: "emp", tranches: { ...defaultTranch } },
          { nom: "tam", tranches: { ...defaultTranch } },
          { nom: "ic", tranches: { ...defaultTranch } },
        ],
      }
    : { catégories: [] };

export const RemunerationGenericForm = ({ mode }: { mode: "coefficient" | "csp" }) => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues:
      (mode === "csp" ? formData.rémunérationsCSP : formData.rémunérationsCoefficients) || buildDefaultCategories(mode),
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = methods;

  const {
    fields: catégories,
    append,
    remove,
  } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "catégories",
  });

  console.log("errors", errors);

  // const catégories = watch("catégories");

  const onSubmit = async (data: FormType) => {
    if (mode === "csp") {
      savePageData("rémunérationsCSP", data as DeclarationFormState["rémunérationsCSP"]);
    } else {
      savePageData("rémunérationsCoefficients", data as DeclarationFormState["rémunérationsCoefficients"]);
    }
    router.push(`${config.base_declaration_url}/remuneration-resultat`);
  };

  const getCSPTitle = (catégorie: Catégorie) =>
    mode === "csp" ? new CSP(catégorie.nom as CSP.Enum).getLabel() : undefined;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          {/* <ReactHookFormDebug /> */}

          <div className={fr.cx("fr-mb-8w")}></div>

          <ClientAnimate className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {catégories.map((catégorie, index) => (
              <div key={index}>
                <div style={{ display: "flex", gap: 20, justifyContent: "space-between", alignItems: "center" }}>
                  {/* Name of catégorie doesn't matter when mode is coef, so don't bother with inconsistent name between storage & UI */}
                  <span className={fr.cx("fr-text--bold")}>{getCSPTitle(catégorie) || `Coefficient ${index + 1}`}</span>
                  {mode !== "csp" && (
                    <Button
                      type="button"
                      priority="tertiary no outline"
                      size="small"
                      iconId="fr-icon-delete-line"
                      onClick={() => remove(index)}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
                <table className={fr.cx("fr-table")}>
                  <thead>
                    <tr>
                      <th>% moins de 30 ans</th>
                      <th>% de 30 à 39 ans</th>
                      <th>% de 40 à 49 ans</th>
                      <th>% 50 ans et plus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <Input
                          label=""
                          nativeInputProps={{
                            type: "number",
                            min: 0,
                            ...register(`catégories.${index}.tranches.:29`, { valueAsNumber: true }),
                          }}
                          state={get(errors, `catégories.${index}.tranches.:29`) ? "error" : "default"}
                          stateRelatedMessage={
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            get(errors, `catégories.${index}.tranches.:29`)?.message
                          }
                        />
                      </td>
                      <td>
                        <Input
                          label=""
                          nativeInputProps={{
                            type: "number",
                            min: 0,
                            ...register(`catégories.${index}.tranches.30:39`, { valueAsNumber: true }),
                          }}
                          state={get(errors, `catégories.${index}.tranches.30:39`) ? "error" : "default"}
                          stateRelatedMessage={
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            get(errors, `catégories.${index}.tranches.30:39`)?.message
                          }
                        />
                      </td>
                      <td>
                        <Input
                          label=""
                          nativeInputProps={{
                            type: "number",
                            min: 0,
                            ...register(`catégories.${index}.tranches.40:49`, { valueAsNumber: true }),
                          }}
                          state={get(errors, `catégories.${index}.tranches.40:49`) ? "error" : "default"}
                          stateRelatedMessage={
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            get(errors, `catégories.${index}.tranches.40:49`)?.message
                          }
                        />
                      </td>
                      <td>
                        <Input
                          label=""
                          nativeInputProps={{
                            type: "number",
                            min: 0,
                            ...register(`catégories.${index}.tranches.50:`, { valueAsNumber: true }),
                          }}
                          state={get(errors, `catégories.${index}.tranches.50:`) ? "error" : "default"}
                          stateRelatedMessage={
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            get(errors, `catégories.${index}.tranches.50:`)?.message
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}

            {mode !== "csp" && (
              <div>
                <div style={{ display: "flex", gap: 20, justifyContent: "space-between", alignItems: "center" }}>
                  <Button
                    type="button"
                    className={fr.cx("fr-mb-4w")}
                    onClick={() => append({ nom: "", tranches: defaultTranch })}
                  >
                    Ajouter un coefficient
                  </Button>
                  <span>
                    {`${catégories.length} coefficient${catégories.length > 1 ? "s" : ""} défini${
                      catégories.length > 1 ? "s" : ""
                    }`}
                  </span>
                </div>
              </div>
            )}
          </ClientAnimate>
        </ClientOnly>

        <ButtonsGroup
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              children: "Précédent",
              priority: "secondary",
              onClick: () => router.push(`${config.base_declaration_url}/remuneration`),
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
