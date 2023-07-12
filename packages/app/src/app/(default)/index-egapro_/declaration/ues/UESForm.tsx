"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { ClientOnly } from "@components/utils/ClientOnly";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { type PropsWithChildren } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = z.object({
  nom: z.string(),
  entreprises: z.array(
    z.object({
      raisonSociale: z.string(),
      siren: z.string(),
    }),
  ),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "ues";

export const UESForm = (props: PropsWithChildren) => {
  const { formData, savePageData, resetFormData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = methods;

  const {
    fields: entreprises,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "entreprises",
  });

  const onSubmit = async (data: FormType) => {
    savePageData("ues", data);

    router.push(funnelConfig(formData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        {/* <ReactHookFormDebug /> */}

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
          />

          <ClientAnimate>
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
                    <td>
                      <span>{formData.commencer?.entrepriseDéclarante?.siren}</span>
                    </td>
                    <td>
                      <span>{formData.commencer?.entrepriseDéclarante?.raisonSociale}</span>
                    </td>
                    <td>
                      <span>Entreprise déclarante</span>
                    </td>
                  </tr>
                  {entreprises.map((entreprise, index) => (
                    <tr key={index}>
                      <td>
                        <Input label="" nativeInputProps={{ ...register(`entreprises.${index}.siren`) }} />
                      </td>
                      <td>
                        <Input
                          label=""
                          disabled={true}
                          nativeInputProps={{ ...register(`entreprises.${index}.raisonSociale`) }}
                        />
                      </td>
                      <td>
                        <Button
                          type="button"
                          iconId="fr-icon-delete-bin-line"
                          priority="tertiary no outline"
                          iconPosition="right"
                          onClick={() => remove(index)}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClientAnimate>
        </ClientOnly>

        <div
          className={fr.cx("fr-col")}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Button
            type="button"
            className={fr.cx("fr-mb-4w")}
            onClick={() => append({ siren: "", raisonSociale: "" })}
            iconId="fr-icon-add-line"
          >
            Ajouter une entreprise
          </Button>
          <span>
            {`${entreprises.length + 1} entreprise${entreprises.length + 1 >= 2 ? "s" : ""} compose${
              entreprises.length + 1 >= 2 ? "nt" : ""
            }`}{" "}
            l'UES
          </span>
        </div>
        <BackNextButtons stepName={stepName} disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
