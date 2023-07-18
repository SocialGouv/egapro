"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodSirenSchema } from "@common/utils/form";
import { ClientOnly } from "@components/utils/ClientOnly";
import { zodResolver } from "@hookform/resolvers/zod";
import { memoizedFetchSiren } from "@services/apiClient";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { AlertMessage } from "packages/app/src/design-system/base/client/AlertMessage";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = z.object({
  nom: z.string().min(1, "Le nom de l'UES est obligatoire"),
  entreprises: z
    .array(
      z.object({
        raisonSociale: z.string(),
        siren: zodSirenSchema, // Only for typing, the Siren validation is done for each Siren in the form.
      }),
    )
    .nonempty({
      message: "Vous devez ajouter au moins une entreprise à l'UES",
    }),
});

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "ues";

export const UESForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  // We ensure to have at least one entreprise in the form, in order to force the user to fill the form and the validation to be triggered, even if the user delete the only entreprise in the form.
  const defaultValues = produce(formData[stepName], draft => {
    if (draft?.entreprises?.length === 0) {
      draft.entreprises = [{ raisonSociale: "", siren: "" }];
    }
  });

  const methods = useForm<FormType>({
    mode: "onBlur",
    resolver: async (data, context, options) => {
      // console.debug("formDataxxx", data);
      // console.debug("validation result", await zodResolver(formSchema)(data, context, options));

      return zodResolver(formSchema)(data, context, options);
    },
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
  } = methods;

  const {
    fields: entreprises,
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

        {/* <ReactHookFormDebug /> */}

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

          <div className={fr.cx("fr-table", "fr-table--layout-fixed", "fr-table--no-caption")}>
            <table>
              <caption>Liste des entreprises de l'UES</caption>
              <thead>
                <tr>
                  <th>Siren</th>
                  <th>Raison sociale</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ paddingTop: 30, paddingBottom: 30 }}>
                    <span style={{ fontSize: "1rem" }}>{formData.commencer?.entrepriseDéclarante?.siren}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "1rem" }}>{formData.commencer?.entrepriseDéclarante?.raisonSociale}</span>
                  </td>
                  <td>
                    <Badge noIcon severity="info">
                      Entreprise déclarante
                    </Badge>
                  </td>
                </tr>
                {entreprises.map((_entreprise, index) => (
                  <tr key={index}>
                    <td>
                      <Input
                        label=""
                        nativeInputProps={{
                          ...register(`entreprises.${index}.siren`),
                          onBlur: async () => {
                            const result = zodSirenSchema.safeParse(watchedEntreprises[index].siren);

                            if (!result.success) {
                              setValue(`entreprises.${index}.raisonSociale`, "");
                              setError(`entreprises.${index}.siren`, {
                                message: result.error.issues[0].message,
                              });
                              return;
                            }

                            const allSirens = watchedEntreprises.map(entreprise => entreprise.siren);

                            const allOtherSirens = [
                              ...allSirens.slice(0, index),
                              ...allSirens.slice(index + 1),
                              formData.commencer?.entrepriseDéclarante?.siren,
                            ];

                            if (allOtherSirens.includes(watchedEntreprises[index].siren)) {
                              setValue(`entreprises.${index}.raisonSociale`, "");
                              setError(`entreprises.${index}.siren`, {
                                message: "Le Siren est déjà dans l'UES",
                              });
                              return;
                            }

                            try {
                              const firm = await memoizedFetchSiren(
                                watchedEntreprises[index].siren,
                                formData.commencer?.annéeIndicateurs,
                              );
                              setValue(`entreprises.${index}.raisonSociale`, firm ? firm.raison_sociale : "");
                              clearErrors(`entreprises.${index}.siren`);
                            } catch (error: unknown) {
                              // console.log("erreur", error);

                              setValue(`entreprises.${index}.raisonSociale`, "");
                              setError(`entreprises.${index}.siren`, {
                                message: "Le Siren est invalide",
                                type: "manual",
                              });
                            }
                          },
                        }}
                        state={errors.entreprises?.[index]?.siren ? "error" : undefined}
                        stateRelatedMessage={errors.entreprises?.[index]?.siren?.message}
                      />
                    </td>
                    <td>
                      <Input
                        label=""
                        disabled={true}
                        nativeInputProps={{
                          ...register(`entreprises.${index}.raisonSociale`),

                          title: watchedEntreprises[index].raisonSociale,
                        }}
                        state={errors.entreprises?.[index]?.raisonSociale ? "error" : undefined}
                        stateRelatedMessage={errors.entreprises?.[index]?.raisonSociale?.message}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Button
                        type="button"
                        iconId="fr-icon-delete-bin-line"
                        priority="tertiary no outline"
                        iconPosition="right"
                        onClick={() => remove(index)}
                      >
                        {""}
                      </Button>
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
              {`${entreprises.length + 1} entreprise${entreprises.length + 1 >= 2 ? "s" : ""} compose${
                entreprises.length + 1 >= 2 ? "nt" : ""
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
