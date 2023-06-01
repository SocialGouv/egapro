"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { type __DEBUG_TYPE__ } from "@common/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { TrancheOptions, type TrancheValues } from "@services/form/declaration/declarationFormBuilder";
import { type PropsWithChildren, useState } from "react";
import { type Message, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  type: z.enum(["entreprise", "ues"]), // No control needed because this is a select with options we provide.
  tranche: z
    .string()
    .transform((val, ctx) => {
      if (!TrancheOptions.find(elt => elt.value === val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le champ est requis",
        });
        return z.NEVER;
      }
      return val;
    })
    .optional(),
});

// Infer the TS type according to the zod schema.
type FormType = __DEBUG_TYPE__<Omit<z.infer<typeof formSchema>, "tranche"> & { tranche: TrancheValues }>;

export const EntrepriseUESForm = (props: PropsWithChildren) => {
  const { formData, saveFormData, resetFormData } = useDeclarationFormManager();
  const [globalMessage, setGlobalMessage] = useState<Message | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: formData?.entreprise?.type,
      tranche: formData?.entreprise?.tranche,
    },
  });

  const type = watch("type");

  console.log("type:", type);

  const onSubmit = async (data: FormType) => {
    console.log("data:", data);

    // saveFormData({ entreprise: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <RadioButtons
        legend="Vous déclarez votre index en tant que :"
        name="type"
        options={[
          {
            label: "Entreprise",
            nativeInputProps: {
              value: "entreprise",
              ...register("type"),
            },
          },
          {
            label: "Unité Économique et Sociale (UES)",
            nativeInputProps: {
              value: "ues",
              ...register("type"),
            },
          },
        ]}
        orientation="horizontal"
      />

      <RadioButtons
        name="tranche"
        legend={`Tranche d'effectifs assujettis de l'${type === "ues" ? "UES" : "entreprise"} :`}
        options={[
          {
            label: "De 50 à 250 inclus",
            nativeInputProps: {
              value: "50:250",
              ...register("tranche"),
            },
          },
          {
            label: "De 251 à 999 inclus",
            nativeInputProps: {
              value: "251:999",
              ...register("tranche"),
            },
          },
          {
            label: "De 1000 à plus",
            nativeInputProps: {
              value: "1000:",
              ...register("tranche"),
            },
          },
        ]}
      />
      <div style={{ display: "flex", gap: 10 }} className={fr.cx("fr-mt-4w")}>
        <Button type="reset" priority="secondary" disabled={isDirty}>
          Réinitialiser
        </Button>
        <Button disabled={!isValid}>Suivant</Button>
      </div>
    </form>
  );
};
