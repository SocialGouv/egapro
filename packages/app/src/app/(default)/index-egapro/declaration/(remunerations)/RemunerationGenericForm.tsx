"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { type Remunerations } from "@common/models/generated";
import { zodNumberOrNaNOrNull } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type Catégorie, type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.object({
  catégories: z.array(
    z.object({
      nom: z.string(),
      tranches: z.object({
        ":29": zodNumberOrNaNOrNull,
        "30:39": zodNumberOrNaNOrNull,
        "40:49": zodNumberOrNaNOrNull,
        "50:": zodNumberOrNaNOrNull,
      }),
    }),
  ),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const defaultTranch = { ":29": null, "30:39": null, "40:49": null, "50:": null };

const buildDefaultCategories = (mode: Remunerations["mode"]) =>
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

export const RemunerationGenericForm = ({ mode }: { mode: Remunerations["mode"] }) => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const stepName: FunnelKey =
    mode === "csp"
      ? "remunerations-csp"
      : mode === "niveau_branche"
      ? "remunerations-coefficient-branche"
      : "remunerations-coefficient-autre";

  const methods = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName] || buildDefaultCategories(mode),
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = methods;

  const {
    fields: catégories,
    append,
    remove,
  } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "catégories",
    rules: {
      minLength: 1,
    },
  });

  const onSubmit = async (data: FormType) => {
    const notFilled = data.catégories.every(
      catégorie =>
        catégorie.tranches[":29"] === null &&
        catégorie.tranches["30:39"] === null &&
        catégorie.tranches["40:49"] === null &&
        catégorie.tranches["50:"] === null,
    );

    if (notFilled) {
      return setError("root.catégories", {
        message:
          mode === "csp"
            ? "Vous devez renseigner les écarts de rémunération pour les CSP et tranches d'âge concernés."
            : "Vous devez renseigner les écarts de rémunération pour les tranches d'âge concernées.",
      });
    }

    savePageData(stepName, data as DeclarationFormState[typeof stepName]);

    router.push(funnelConfig(formData)[stepName].next().url);
  };

  const getCSPTitle = (catégorie: Catégorie) =>
    mode === "csp" ? new CSP(catégorie.nom as CSP.Enum).getLabel() : undefined;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          <div className={fr.cx("fr-mb-8w")}></div>

          <ClientAnimate className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {catégories.map((catégorie, index) => (
              <div key={index}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  className={fr.cx("fr-col")}
                >
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
                <div className={fr.cx("fr-table", "fr-table--no-caption")}>
                  <table>
                    <caption>Tableau des rémunérations</caption>
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
                          <PercentageInput name={`catégories.${index}.tranches.:29`} />
                        </td>
                        <td>
                          <PercentageInput name={`catégories.${index}.tranches.30:39`} />
                        </td>
                        <td>
                          <PercentageInput name={`catégories.${index}.tranches.40:49`} />
                        </td>
                        <td>
                          <PercentageInput name={`catégories.${index}.tranches.50:`} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </ClientAnimate>

          {mode !== "csp" && (
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              className={fr.cx("fr-mb-8w")}
            >
              <Button type="button" onClick={() => append({ nom: "", tranches: defaultTranch })}>
                Ajouter un coefficient
              </Button>

              <span>
                {`${catégories.length} coefficient${catégories.length > 1 ? "s" : ""} défini${
                  catégories.length > 1 ? "s" : ""
                }`}
              </span>
            </div>
          )}
        </ClientOnly>

        <ClientAnimate>
          {errors.root?.catégories && (
            <Alert severity="error" title="Informations manquantes" description={errors.root.catégories.message} />
          )}
        </ClientAnimate>
        <BackNextButtons stepName={stepName} disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
