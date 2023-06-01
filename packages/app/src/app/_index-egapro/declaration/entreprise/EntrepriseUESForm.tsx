"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { useRouter } from "next/navigation";
import { type PropsWithChildren, useState } from "react";
import { type Message, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  type: z.string(), // No extra control needed because this is a radio button with options we provide.
  tranche: z.string(), // No extra control needed because this is a radio button with options we provide.
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

export const EntrepriseUESForm = (props: PropsWithChildren) => {
  const { formData, saveFormData, resetFormData } = useDeclarationFormManager();
  const [globalMessage, setGlobalMessage] = useState<Message | undefined>(undefined);
  const router = useRouter();

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (data: FormType) => {
    saveFormData({ entreprise: data as DeclarationFormState["entreprise"] });

    if (type === "ues") router.push("/_index-egapro/declaration/ues");
    else router.push("/_index-egapro/declaration/periode-reference");
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
