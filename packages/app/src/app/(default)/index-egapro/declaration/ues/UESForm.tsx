"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { sirenSchema } from "@common/core-domain/dtos/helpers/common";
import { isCompanyClosed } from "@common/core-domain/helpers/entreprise";
import { zodFr } from "@common/utils/zod";
import { ClientOnly } from "@components/utils/ClientOnly";
import { AlertMessage } from "@design-system/client";
import { getCompany } from "@globalActions/company";
import { CLOSED_COMPANY_ERROR } from "@globalActions/companyErrorCodes";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = (siren: string, year: number) =>
  zodFr
    .object({
      nom: z.string().trim().nonempty("Le nom de l'UES est obligatoire"),
      entreprises: z
        .array(
          z.object({
            raisonSociale: z.string(),
            siren: z.string(),
          }),
        )
        .nonempty({
          message: "Vous devez ajouter au moins une entreprise à l'UES",
        }),
    })
    .superRefine(async (data, ctx) => {
      console.log("dans superrefine");
      const allSirens = [siren, ...data.entreprises.map(entreprise => entreprise.siren)];

      for (let index = 0; index < data.entreprises.length; index++) {
        const company = data.entreprises[index];

        const parsedSiren = sirenSchema.safeParse(company.siren);

        if (!parsedSiren.success) {
          ctx.addIssue({
            code: "custom",
            message: parsedSiren.error?.issues?.[0]?.message ?? "Le Siren est invalide",
            path: ["entreprises", index, "siren"],
          });
        }

        const nbOccurences = allSirens.filter(siren => siren === company.siren).length;

        if (nbOccurences > 1) {
          ctx.addIssue({
            code: "custom",
            message: "Le Siren est déjà dans l'UES",
            path: ["entreprises", index, "siren"],
          });
        }

        // We fetch the latest data for the entreprise to fill the entreprise page.
        const result = await getCompany(siren);

        if (result.ok) {
          const company = result.data;

          const isClosed = isCompanyClosed(company, year);

          if (isClosed) {
            ctx.addIssue({
              code: "custom",
              message: CLOSED_COMPANY_ERROR,
              path: ["entreprises", index, "siren"],
            });
          }
        } else {
          ctx.addIssue({
            code: "custom",
            message: "Impossible de récupérer les informations de l'entreprise",
            path: ["entreprises", index, "siren"],
          });
        }
      }
    });

type FormType = z.infer<ReturnType<typeof formSchema>>;

const stepName: FunnelKey = "ues";

export const UESForm = () => {
  const router = useRouter();
  const { formData, savePageData } = useDeclarationFormManager();
  const [valid, setValid] = useState<false | true | undefined>();

  // assertOrRedirectCommencerStep(formData);

  // We ensure to have at least one entreprise in the form, in order to force the user to fill the form and the validation to be triggered, even if the user delete the only entreprise in the form.
  const defaultValues = produce(formData[stepName], draft => {
    if (draft?.entreprises?.length === 0) {
      draft.entreprises = [{ raisonSociale: "", siren: "" }];
    }
  });

  const methods = useForm<FormType>({
    mode: "onChange",

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

  const watchedEntreprises = watch("entreprises");
  const [stringifiedCompanies] = useDebounce(JSON.stringify(watchedEntreprises), 500);

  console.log("watchedEntreprises", watchedEntreprises?.map(entreprise => entreprise.siren));

  const onSubmit = async (data: FormType) => {
    savePageData("ues", data);

    router.push(funnelConfig(formData)[stepName].next().url);
  };

  // TODO: essayer avec un useEffect
  // - memoize les fetch pour ne pas les refaire à chaque fois

  useEffect(() => {
    async function run() {
      console.log("dans useEffect");
      clearErrors("entreprises");

      let valid = true;

      const siren = formData.commencer!.siren;
      const year = formData.commencer!.annéeIndicateurs;

      const companies = JSON.parse(stringifiedCompanies) as FormType["entreprises"];

      if (companies.length === 0) {
        setError("entreprises", { type: "custom", message: "Vous devez ajouter au moins une entreprise à l'UES" });
        valid = false;
      }

      const allSirens = [siren, ...companies.map(entreprise => entreprise.siren)];

      for (let index = 0; index < companies.length; index++) {
        const company = companies[index];

        console.log("validate index", index, company.siren);
        console.log("companies.length", companies.length);

        const parsedSiren = sirenSchema.safeParse(company.siren);

        if (!parsedSiren.success) {
          setError(`entreprises.${index}.siren`, { type: "custom", message: "Le Siren est invalide" });
          valid = false;
          continue;
        }

        const nbOccurences = allSirens.filter(siren => siren === company.siren).length;

        if (nbOccurences > 1) {
          setError(`entreprises.${index}.siren`, { type: "custom", message: "Le Siren est déjà dans l'UES" });
          valid = false;
          continue;
        }

        // We fetch the latest data for the entreprise to fill the entreprise page.
        const result = await getCompany(company.siren);

        if (result.ok) {
          const company = result.data;

          const isClosed = isCompanyClosed(company, year);

          if (isClosed) {
            setError(`entreprises.${index}.siren`, { type: "custom", message: CLOSED_COMPANY_ERROR });
            valid = false;
          } else {
            setValue(`entreprises.${index}.raisonSociale`, company.simpleLabel);
          }
        } else {
          setError(`entreprises.${index}.siren`, {
            type: "custom",
            message: "Impossible de récupérer les informations de l'entreprise",
          });
          valid = false;
        }
      }

      setValid(valid);
    }

    run();
  }, [clearErrors, formData.commencer, setError, setValue, stringifiedCompanies]); // We need to stringify the array to trigger the useEffect when the array changes.

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
                  <th style={{ width: "20%" }}>Siren</th>
                  <th style={{ width: "50%" }}>Raison sociale</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ paddingTop: 30, paddingBottom: 30 }}>
                    <span style={{ fontSize: "1rem" }}>{formData.entreprise?.entrepriseDéclarante?.siren}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "1rem" }}>{formData.entreprise?.entrepriseDéclarante?.raisonSociale}</span>
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
                        }}
                        state={errors.entreprises?.[index]?.siren && "error"}
                      />
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
                    <td style={{ textAlign: "right" }}>
                      <Button
                        title="Supprimer l'entreprise"
                        type="button"
                        iconId="fr-icon-delete-bin-line"
                        priority="tertiary no outline"
                        onClick={() => remove(index)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ClientOnly>

        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          className={fr.cx("fr-mb-8w")}
        >
          <Button
            type="button"
            onClick={() => {
              append({ siren: "", raisonSociale: "" });
              setValid(undefined);
            }}
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

        <BackNextButtons stepName={stepName} disabled={!valid} />
      </form>
    </FormProvider>
  );
};
