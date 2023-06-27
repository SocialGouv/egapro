"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { config } from "@common/config";
import { ClientOnly } from "@components/ClientOnly";
import { ReactHookFormDebug } from "@components/utils/debug/ReactHookFormDebug";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { get } from "lodash";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  note: z.number(),
  populationFavorable: z.string(),
  résultat: z.number(),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

export const RemunerationCSPResultatForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log("formData", data);
      console.log("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },

    // resolver: zodResolver(formSchema),
    defaultValues: formData.rémunérationsRésultat,
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = methods;

  console.log("errors", errors);
  // console.log("isValid", isValid);

  const onBlur = () => {
    // Calculer la note
  };

  const onSubmit = async (data: FormType) => {
    savePageData("rémunérationsRésultat", data as DeclarationFormState["rémunérationsRésultat"]);
    router.push(
      `${config.base_declaration_url}/${
        formData.entreprise?.tranche === "50:250" ? "augmentations-et-promotions" : "augmentations"
      }`,
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          <ReactHookFormDebug />

          <Input
            label="Résultat final en % après application du seuil de pertinence à chaque catégorie ou niveau/coefficient
            9 chiffres"
            nativeInputProps={{
              type: "number",
              min: 0,
              ...register(`résultat`, { valueAsNumber: true }),
            }}
            state={get(errors, `résultat`) ? "error" : "default"}
            stateRelatedMessage={
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              get(errors, `résultat`)?.message
            }
          />

          <RadioButtons
            legend="Population envers laquelle l'écart est favorable"
            options={[
              {
                label: "Femmes",
                nativeInputProps: {
                  value: "femmes",
                  ...register("populationFavorable"),
                },
              },
              {
                label: "Hommes",
                nativeInputProps: {
                  value: "homme",
                  ...register("populationFavorable"),
                },
              },
            ]}
            orientation="horizontal"
          />

          <div style={{ border: "1px solid lightgrey", display: "flex", gap: 30, padding: 20, margin: "50px 0" }}>
            <div style={{ borderRight: "1px solid gray", paddingRight: 20 }}>19 / 100</div>
            <div>Nombre de points obtenus à l'indicateur</div>
          </div>
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
                // disabled: !isValid,
              },
            },
          ]}
        />
      </form>
    </FormProvider>
  );
};
