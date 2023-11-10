"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { type Catégorie, type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { type Remunerations } from "@common/models/generated";
import { zodNumberOrNaNOrNull } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { PercentageInput } from "@components/RHF/PercentageInput";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";
import style from "./RemunerationGenericForm.module.scss";

const formSchema = zodFr.object({
  catégories: z
    .array(
      z.object({
        nom: z.string(),
        tranches: z.object({
          [AgeRange.Enum.LESS_THAN_30]: zodNumberOrNaNOrNull,
          [AgeRange.Enum.FROM_30_TO_39]: zodNumberOrNaNOrNull,
          [AgeRange.Enum.FROM_40_TO_49]: zodNumberOrNaNOrNull,
          [AgeRange.Enum.FROM_50_TO_MORE]: zodNumberOrNaNOrNull,
        }),
      }),
    )
    .superRefine((val, ctx) => {
      if (notFilled(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vous devez renseigner au moins un écart si votre indicateur est calculable",
        });
      }
    }),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const notFilled = (catégories: FormType["catégories"]) =>
  catégories.every(
    catégorie =>
      catégorie.tranches[AgeRange.Enum.LESS_THAN_30] === null &&
      catégorie.tranches[AgeRange.Enum.FROM_30_TO_39] === null &&
      catégorie.tranches[AgeRange.Enum.FROM_40_TO_49] === null &&
      catégorie.tranches[AgeRange.Enum.FROM_50_TO_MORE] === null,
  );

const defaultTranch = { ":29": null, "30:39": null, "40:49": null, "50:": null };

const buildDefaultCategories = (mode: Remunerations["mode"]) =>
  mode === "csp"
    ? {
        catégories: [
          { nom: CSP.Enum.OUVRIERS, tranches: { ...defaultTranch } },
          { nom: CSP.Enum.EMPLOYES, tranches: { ...defaultTranch } },
          { nom: CSP.Enum.TECHNICIENS_AGENTS_MAITRISES, tranches: { ...defaultTranch } },
          { nom: CSP.Enum.INGENIEURS_CADRES, tranches: { ...defaultTranch } },
        ],
      }
    : { catégories: [] };

export const RemunerationGenericForm = ({ mode }: { mode: Remunerations["mode"] }) => {
  const stepName: FunnelKey =
    mode === "csp"
      ? "remunerations-csp"
      : mode === "niveau_branche"
      ? "remunerations-coefficient-branche"
      : "remunerations-coefficient-autre";

  const router = useRouter();
  const { formData, savePageData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

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
    if (notFilled(data.catégories)) {
      return setError("root.catégories", {
        message:
          mode === "csp"
            ? "Vous devez renseigner les écarts de rémunération pour les CSP et tranches d'âge concernés."
            : "Vous devez renseigner les écarts de rémunération pour les tranches d'âge concernées.",
      });
    }

    savePageData(stepName, data as DeclarationDTO[typeof stepName]);

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
                <div className={cx(fr.cx("fr-col"), style["category-title"])}>
                  {/* Name of catégorie doesn't matter when mode is coef, so don't bother with inconsistent name between storage & UI */}
                  <span className={fr.cx("fr-text--bold")}>
                    {getCSPTitle(catégorie) || `Niveau ou coefficient ${index + 1}`}
                  </span>
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
                        <th>Moins de 30 ans</th>
                        <th>De 30 à 39 ans</th>
                        <th>De 40 à 49 ans</th>
                        <th>50 ans et plus</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[
                          AgeRange.Enum.LESS_THAN_30,
                          AgeRange.Enum.FROM_30_TO_39,
                          AgeRange.Enum.FROM_40_TO_49,
                          AgeRange.Enum.FROM_50_TO_MORE,
                        ].map(key => (
                          <td key={key}>
                            <PercentageInput<FormType> name={`catégories.${index}.tranches.${key}`} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </ClientAnimate>

          {mode !== "csp" && (
            <div className={cx(fr.cx("fr-mb-8w"), style["add-category"])}>
              <Button type="button" onClick={() => append({ nom: "", tranches: defaultTranch })}>
                Ajouter un niveau ou coefficient
              </Button>

              <span>
                {`${catégories.length} niveau${catégories.length > 1 ? "x" : ""} ou coefficient${
                  catégories.length > 1 ? "s" : ""
                } défini${catégories.length > 1 ? "s" : ""}`}
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
