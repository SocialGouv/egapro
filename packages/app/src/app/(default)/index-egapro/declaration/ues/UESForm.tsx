"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { sirenSchema } from "@common/core-domain/dtos/helpers/common";
import { isCompanyClosed } from "@common/core-domain/helpers/entreprise";
import { zodFr } from "@common/utils/zod";
import { ClientOnly } from "@components/utils/ClientOnly";
import { AlertMessage } from "@design-system/client";
import { getCompany } from "@globalActions/company";
import { CLOSED_COMPANY_ERROR } from "@globalActions/companyErrorCodes";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { countBy } from "lodash";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";
import style from "./UESForm.module.scss";

type ValidateResult = { data?: string; ok: true } | { error: string; ok: false };

const MANDATORY_SIREN_ERROR = "Le Siren est requis";
const INVALID_SIREN_ERROR = "Le Siren est invalide";

const formSchema = zodFr.object({
  nom: z.string().trim().nonempty(),
  entreprises: z
    .array(
      z.object({
        raisonSociale: z.string(),
        siren: z.string(),
      }),
    )
    .nonempty(),
});

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "ues";

export const UESForm = () => {
  const router = useRouter();
  const { formData, savePageData } = useDeclarationFormManager();
  const [checkDuplicateRequest, setCheckDuplicateRequest] = useState(false);

  // assertOrRedirectCommencerStep(formData);

  const defaultValues = formData[stepName] ?? {
    nom: "",
    entreprises: [],
  };

  const methods = useForm<FormType>({
    // no resolver, because we handle the validation by ourselves.
    defaultValues,
  });

  const {
    clearErrors,
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
    watch,
  } = methods;

  const {
    fields: entreprisesFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "entreprises",
  });

  const siren = formData.commencer!.siren;
  const year = formData.commencer!.annéeIndicateurs;

  const watchedCompanies = watch("entreprises");
  const watchedName = watch("nom");

  const controlledCompaniesFields = entreprisesFields.map((field, index) => {
    return {
      ...field,
      ...watchedCompanies[index],
    };
  });

  const countEmptySiren = controlledCompaniesFields.filter(company => !company.siren).length;
  const countEntreprisesErrors = Object.keys(errors.entreprises ?? {}).length;

  const checkAllSirens = useCallback(() => {
    clearErrors("entreprises");

    const allSirens = [siren, ...controlledCompaniesFields.map(company => company.siren)];
    const countOfSirenOccurences = countBy(allSirens);

    controlledCompaniesFields.forEach((entrepriseField, entrepriseFieldIndex) => {
      if (countOfSirenOccurences[entrepriseField.siren] > 1) {
        setError(`entreprises.${entrepriseFieldIndex}.siren`, {
          type: "custom",
          message: "Le Siren est déjà dans l'UES",
        });
      }

      if (!entrepriseField.siren) {
        setError(`entreprises.${entrepriseFieldIndex}.siren`, {
          type: "custom",
          message: MANDATORY_SIREN_ERROR,
        });
      }

      if (!sirenSchema.safeParse(entrepriseField.siren).success) {
        setError(`entreprises.${entrepriseFieldIndex}.siren`, {
          type: "custom",
          message: INVALID_SIREN_ERROR,
        });
      }
    });
  }, [clearErrors, controlledCompaniesFields, setError, siren]);

  useEffect(() => {
    if (checkDuplicateRequest) {
      checkAllSirens();
      setCheckDuplicateRequest(false);
    }
  }, [checkDuplicateRequest, checkAllSirens, setCheckDuplicateRequest]);

  const validateOneSiren = async (childSiren: string): Promise<ValidateResult> => {
    const parsedSiren = sirenSchema.safeParse(childSiren);

    if (!parsedSiren) {
      return { ok: false, error: MANDATORY_SIREN_ERROR };
    }

    if (!parsedSiren.success) {
      return { ok: false, error: INVALID_SIREN_ERROR };
    }

    // We fetch the latest data for the entreprise to fill the entreprise page.
    const result = await getCompany(childSiren);

    if (result.ok) {
      const company = result.data;

      const isClosed = isCompanyClosed(company, year);

      if (isClosed) {
        return { ok: false, error: CLOSED_COMPANY_ERROR };
      } else {
        return { ok: true, data: company.simpleLabel };
      }
    } else {
      return { ok: false, error: "Impossible de récupérer les informations de l'entreprise" };
    }
  };

  const onChangeChildSiren = async (childSiren: string, index: number) => {
    clearErrors(`entreprises.${index}.siren`);

    const result = await validateOneSiren(childSiren);

    if (!result.ok) {
      setError(`entreprises.${index}.siren`, { type: "custom", message: result.error });
    } else {
      setValue(`entreprises.${index}.raisonSociale`, result?.data || "");
      // Run check duplicate routine in case some sirens are now duplicates.
      setCheckDuplicateRequest(true);
    }
  };

  const onSubmit = async (data: FormType) => {
    let ok = true;
    if (!watchedName.trim()) {
      setError("nom", { type: "custom", message: "Le nom de l'UES est obligatoire" });
      ok = false;
    }

    if (watchedCompanies.length === 0) {
      setError("entreprises", { type: "custom", message: "Vous devez ajouter au moins une entreprise à l'UES" });
      ok = false;
    }

    if (!ok) return;

    savePageData("ues", data);
    router.push(funnelConfig(formData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <AlertMessage title="Erreur" message={errors.entreprises?.message} />

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <p className={fr.cx("fr-mt-4w")}>
          La raison sociale des entreprises composant l'UES est renseignée automatiquement et n'est pas modifiable
          (source : Répertoire Sirene de l'INSEE).
        </p>

        <ClientOnly>
          <Input
            label="Nom de l'UES"
            hintText="Le nom doit être identique à celui de vos déclarations précédentes"
            className={fr.cx("fr-mb-8w")}
            nativeInputProps={{
              ...register("nom"),
            }}
            state={errors.nom?.message ? "error" : undefined}
            stateRelatedMessage={errors.nom?.message}
          />

          <span className={fr.cx("fr-label", "fr-mb-1w")}>Entreprises composant l'UES</span>
          <div className={fr.cx("fr-table", "fr-table--layout-fixed", "fr-table--no-caption")}>
            <table>
              <caption>Liste des entreprises de l'UES</caption>
              <thead>
                <tr>
                  <th className={style["siren-col"]}>Siren</th>
                  <th className={style["name-col"]}>Raison sociale</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={style["siren-display"]}>
                    <span className={style["display-text"]}>{formData.entreprise?.entrepriseDéclarante?.siren}</span>
                  </td>
                  <td>
                    <span className={style["display-text"]}>
                      {formData.entreprise?.entrepriseDéclarante?.raisonSociale}
                    </span>
                  </td>
                  <td>
                    <Badge noIcon severity="info">
                      Entreprise déclarante
                    </Badge>
                  </td>
                </tr>
                {entreprisesFields.map((entrepriseField, index) => (
                  <tr key={entrepriseField.id}>
                    <td>
                      {(() => {
                        const registerMethods = register(`entreprises.${index}.siren`);
                        return (
                          <Input
                            label="Siren entreprise"
                            hideLabel
                            classes={{
                              message: fr.cx("fr-hidden"),
                            }}
                            nativeInputProps={{
                              ...register(`entreprises.${index}.siren`),
                              maxLength: 9,
                              minLength: 9,
                              onChange: e => {
                                registerMethods.onChange(e);
                                onChangeChildSiren(e.target.value, index);
                              },
                              onBlur: e => {
                                registerMethods.onBlur(e);
                                if (!e.target.value) {
                                  setError(`entreprises.${index}.siren`, {
                                    type: "custom",
                                    message: MANDATORY_SIREN_ERROR,
                                  });
                                }
                              },
                            }}
                            state={errors.entreprises?.[index]?.siren && "error"}
                          />
                        );
                      })()}
                    </td>
                    <td>
                      {errors.entreprises?.[index]?.siren ? (
                        <span className={fr.cx("fr-error-text", "fr-text--sm")}>
                          {errors.entreprises?.[index]?.siren?.message}
                        </span>
                      ) : (
                        <Input
                          label="Raison sociale entreprise"
                          hideLabel
                          disabled
                          nativeInputProps={{
                            ...register(`entreprises.${index}.raisonSociale`),
                          }}
                          state={errors.entreprises?.[index]?.raisonSociale && "error"}
                          stateRelatedMessage={errors.entreprises?.[index]?.raisonSociale?.message}
                        />
                      )}
                    </td>
                    <td className="text-right">
                      <Button
                        title="Supprimer l'entreprise"
                        type="button"
                        iconId="fr-icon-delete-bin-line"
                        priority="tertiary no outline"
                        onClick={() => {
                          remove(index);
                          setCheckDuplicateRequest(true);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ClientOnly>

        <div className={cx(fr.cx("fr-mb-8w"), style["add-entreprise"])}>
          <Button
            type="button"
            onClick={() => {
              append({ siren: "", raisonSociale: "" });
            }}
            disabled={countEmptySiren >= 1}
            iconId="fr-icon-add-line"
          >
            Ajouter une entreprise
          </Button>

          <ClientOnly>
            <span>
              {`${entreprisesFields.length + 1} entreprise${entreprisesFields.length + 1 >= 2 ? "s" : ""} compose${
                entreprisesFields.length + 1 >= 2 ? "nt" : ""
              }`}{" "}
              l'UES
            </span>
          </ClientOnly>
        </div>

        <BackNextButtons stepName={stepName} disabled={countEntreprisesErrors >= 1} />
      </form>
    </FormProvider>
  );
};
