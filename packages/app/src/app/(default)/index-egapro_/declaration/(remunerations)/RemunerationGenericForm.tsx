"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { zodNumberOrNaN } from "@common/utils/form";
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

// z.nan allows us to have a non defined value which is still of type number. Cool trick for TS.
const formSchema = z.object({
  catégories: z.array(
    z.object({
      nom: z.string(),
      tranches: z.object({
        ":29": zodNumberOrNaN,
        "30:39": zodNumberOrNaN,
        "40:49": zodNumberOrNaN,
        "50:": zodNumberOrNaN,
      }),
    }),
  ),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const defaultTranch = { ":29": NaN, "30:39": NaN, "40:49": NaN, "50:": NaN };

const buildDefaultCategories = (mode: RemunerationsMode.Enum) =>
  mode === RemunerationsMode.Enum.CSP
    ? {
        catégories: [
          { nom: "ouv", tranches: { ...defaultTranch } },
          { nom: "emp", tranches: { ...defaultTranch } },
          { nom: "tam", tranches: { ...defaultTranch } },
          { nom: "ic", tranches: { ...defaultTranch } },
        ],
      }
    : { catégories: [] };

const replaceNullWithNaN = ({ catégories }: FormType) => {
  return {
    catégories: catégories.map(({ tranches, ...rest }) => ({
      ...rest,
      tranches: Object.fromEntries(Object.entries(tranches).map(([key, value]) => [key, value ?? NaN])),
    })),
  } as FormType;
};

export const RemunerationGenericForm = ({ mode }: { mode: RemunerationsMode.Enum }) => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const stepName: FunnelKey =
    mode === RemunerationsMode.Enum.CSP
      ? "remunerations-csp"
      : mode === RemunerationsMode.Enum.BRANCH_LEVEL
      ? "remunerations-coefficient-branche"
      : "remunerations-coefficient-autre";

  const methods = useForm<FormType>({
    mode: "onChange",
    // resolver: zodResolver(formSchema),
    resolver: async (data, context, options) => {
      // console.debug("formData", data);

      // We need to fix RHF because it replaces NaN with null under the hood...But null is not of type number.
      const fixedDataWithNaN = replaceNullWithNaN(data);
      // console.debug("validation result", await zodResolver(formSchema)(fixedDataWithNaN, context, options));

      return zodResolver(formSchema)(fixedDataWithNaN, context, options);
    },
    defaultValues: formData[stepName] || buildDefaultCategories(mode),
  });

  const {
    control,
    handleSubmit,
    formState: { errors: _errors, isValid },
  } = methods;

  const {
    fields: catégories,
    append,
    remove,
  } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "catégories",
  });

  const onSubmit = async (data: FormType) => {
    savePageData(stepName, data as DeclarationFormState[typeof stepName]);

    router.push(funnelConfig(formData)[stepName].next().url);
  };

  const getCSPTitle = (catégorie: Catégorie) =>
    mode === RemunerationsMode.Enum.CSP ? new CSP(catégorie.nom as CSP.Enum).getLabel() : undefined;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          {/* <ReactHookFormDebug /> */}

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

        <BackNextButtons stepName={stepName} disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
