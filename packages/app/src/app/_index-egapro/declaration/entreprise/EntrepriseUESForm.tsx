"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type FormEventHandler, type PropsWithChildren, useState } from "react";
import { type Message } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  type: z.string().min(1, "Le type est requis."), // No control needed because this is a select with options we provide.
  tranche: z.string().min(1, "La tranche est requise."),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

export const EntrepriseUESForm = (props: PropsWithChildren<Props>) => {
  const { formData, saveFormData, resetFormData } = useDeclarationFormManager();
  const [globalMessage, setGlobalMessage] = useState<Message | undefined>(undefined);

  const [type, setType] = useState<FormType["type"] | undefined>(undefined);
  const [tranche, setTranche] = useState<FormType["tranche"] | undefined>(undefined);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();

    console.log("dans handleSubmit");
  };

  return (
    <form onSubmit={handleSubmit}>
      <RadioButtons
        legend="Vous déclarez votre index en tant que :"
        name="type"
        options={[
          {
            label: "Entreprise",
            nativeInputProps: {
              checked: type === "entreprise",
              onChange: () => setType("entreprise"),
            },
          },
          {
            label: "Unité Économique et Sociale (UES)",
            nativeInputProps: {
              checked: type === "ues",
              onChange: () => setType("ues"),
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
              checked: tranche === "50:250",
              onChange: () => setTranche("50:250"),
            },
          },
          {
            label: "De 251 à 999 inclus",
            nativeInputProps: {
              checked: tranche === "251:999",
              onChange: () => setTranche("251:999"),
            },
          },
          {
            label: "De 1000 à plus",
            nativeInputProps: {
              checked: tranche === "1000:",
              onChange: () => setTranche("1000:"),
            },
          },
        ]}
      />
      <div style={{ display: "flex", gap: 10 }} className={fr.cx("fr-mt-4w")}>
        <Button type="reset" priority="secondary">
          Réinitialiser
        </Button>
        <Button>Suivant</Button>
      </div>
    </form>
  );
};
