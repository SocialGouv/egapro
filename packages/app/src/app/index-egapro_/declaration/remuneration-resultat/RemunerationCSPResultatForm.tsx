"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { config } from "@common/config";
import { computeIndicator1Note } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { ClientOnly } from "@components/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    note: z.number(),
    populationFavorable: z.string(),
    résultat: z.number(),
  })
  .superRefine(({ note, populationFavorable }, ctx) => {
    if (note !== 40 && !populationFavorable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La population envers laquelle l'écart est favorable est obligatoire",
        path: ["populationFavorable"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

export const RemunerationCSPResultatForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();
  const [populationFavorableDisabled, setPopulationFavorableDisabled] = useState<boolean>();

  const methods = useForm<FormType>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.log("formData", data);
      // console.log("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },
    mode: "onChange",
    // resolver: zodResolver(formSchema),
    defaultValues: formData.rémunérationsRésultat,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = methods;

  const résultat = watch("résultat");
  const note = watch("note");

  useEffect(() => {
    const note = computeIndicator1Note(résultat);
    setValue("note", note);
    setPopulationFavorableDisabled(note === 40);
    if (note === 40) setValue("populationFavorable", "");
  }, [résultat, setValue]);

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
          {/* <ReactHookFormDebug /> */}

          <Input
            label="Résultat final en % après application du seuil de pertinence à chaque catégorie ou niveau/coefficient
            9 chiffres"
            nativeInputProps={{
              type: "number",
              min: 0,
              max: 100,
              ...register(`résultat`, { valueAsNumber: true }),
            }}
            state={errors.résultat?.message ? "error" : "default"}
            stateRelatedMessage={errors.résultat?.message}
          />

          <RadioButtons
            legend="Population envers laquelle l'écart est favorable"
            disabled={populationFavorableDisabled}
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

          {note !== undefined && (
            <>
              <div style={{ border: "1px solid lightgrey", display: "flex", gap: 30, padding: 20, margin: "50px 0" }}>
                <div style={{ borderRight: "1px solid gray", paddingRight: 20 }}>{note} / 40</div>
                <div>Nombre de points obtenus à l'indicateur</div>
              </div>

              <Input
                label=""
                nativeInputProps={{
                  type: "hidden",
                  value: note,
                  ...register(`note`, { valueAsNumber: true }),
                }}
              />
            </>
          )}
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
