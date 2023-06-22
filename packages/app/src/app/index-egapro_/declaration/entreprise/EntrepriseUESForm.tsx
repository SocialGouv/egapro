"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { config } from "@common/config";
import { ClientOnly } from "@components/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  type: z.string(), // No extra control needed because this is a radio button with options we provide.
  tranche: z.string(), // No extra control needed because this is a radio button with options we provide.
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

export const EntrepriseUESForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: formData?.entreprise?.type,
      tranche: formData?.entreprise?.tranche,
    },
  });

  const type = watch("type");

  const onSubmit = async (data: FormType) => {
    savePageData("entreprise", data as DeclarationFormState["entreprise"]);

    if (type === "ues") router.push(`${config.base_declaration_url}/ues`);
    else router.push(`${config.base_declaration_url}/periode-reference`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <RadioButtons
        legend="Vous déclarez votre index en tant que"
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

      <ClientOnly fallback={<SkeletonForm fields={2} />}>
        <RadioButtons
          legend={`Tranche d'effectifs assujettis de l'${type === "ues" ? "UES" : "entreprise"}`}
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
      </ClientOnly>
      <ButtonsGroup
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Précédent",
            priority: "secondary",
            onClick: () => router.push(`${config.base_declaration_url}/commencer`),
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
  );
};
