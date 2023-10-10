"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { sirenSchema } from "@common/core-domain/dtos/helpers/common";
import { isCompanyClosed } from "@common/core-domain/helpers/entreprise";
import { AppError } from "@common/shared-domain";
import { zodFr } from "@common/utils/zod";
import { ClientOnly } from "@components/utils/ClientOnly";
import { AlertMessage } from "@design-system/client";
import { getCompany } from "@globalActions/company";
import { CLOSED_COMPANY_ERROR } from "@globalActions/companyErrorCodes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import assert from "assert";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { type ChangeEvent } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.object({
  nom: z.string().trim().nonempty("Le nom de l'UES est obligatoire"),
  entreprises: z
    .array(
      z.object({
        raisonSociale: z.string().trim().nonempty(),
        siren: z.string(), // Custom validation in the form.
      }),
    )
    .nonempty({
      message: "Vous devez ajouter au moins une entreprise à l'UES",
    }),
});

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "ues";

export const UESForm = () => {
  const router = useRouter();
  const { formData, savePageData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  // We ensure to have at least one entreprise in the form, in order to force the user to fill the form and the validation to be triggered, even if the user delete the only entreprise in the form.
  const defaultValues = produce(formData[stepName], draft => {
    if (draft?.entreprises?.length === 0) {
      draft.entreprises = [{ raisonSociale: "", siren: "" }];
    }
  });

  const methods = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const {
    clearErrors,
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isValid },
    watch,
    trigger,
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

  const onSubmit = async (data: FormType) => {
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
                          onBlur: async (e: ChangeEvent<HTMLInputElement>) => {
                            const siren = e.target.value;

                            const parsedSiren = sirenSchema.safeParse(siren);

                            if (!parsedSiren.success) {
                              setValue(`entreprises.${index}.raisonSociale`, "");
                              setError(`entreprises.${index}.siren`, {
                                message: parsedSiren.error?.issues?.[0]?.message ?? "Le Siren est invalide",
                              });
                              return;
                            }

                            const allSirens = watchedEntreprises.map(entreprise => entreprise.siren);

                            const allOtherSirens = [
                              ...allSirens.slice(0, index),
                              ...allSirens.slice(index + 1),
                              formData.commencer?.siren,
                            ];

                            if (allOtherSirens.includes(siren)) {
                              setValue(`entreprises.${index}.raisonSociale`, "");
                              setError(`entreprises.${index}.siren`, {
                                message: "Le Siren est déjà dans l'UES",
                              });
                              return;
                            }

                            // We fetch the latest data for the entreprise to fill the entreprise page.
                            const result = await getCompany(siren);

                            assert(formData.commencer?.annéeIndicateurs, "L'année est obligatoire");

                            try {
                              if (result.ok) {
                                const company = result.data;

                                const isClosed = isCompanyClosed(company, formData.commencer.annéeIndicateurs);

                                if (isClosed) throw new AppError(CLOSED_COMPANY_ERROR);

                                setValue(`entreprises.${index}.raisonSociale`, company ? company.simpleLabel : "");
                                clearErrors(`entreprises.${index}.siren`);
                                trigger();
                              }
                            } catch (error: unknown) {
                              setValue(`entreprises.${index}.raisonSociale`, "");
                              setError(`entreprises.${index}.siren`, {
                                message: error instanceof AppError ? error.message : "Le Siren est invalide",
                                type: "manual",
                              });
                            }
                          },
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
                          textArea
                          disabled
                          nativeTextAreaProps={{
                            ...register(`entreprises.${index}.raisonSociale`),
                            title: watchedEntreprises[index].raisonSociale,
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
              clearErrors();
              append({ siren: "", raisonSociale: "" });
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

        <BackNextButtons stepName={stepName} disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
