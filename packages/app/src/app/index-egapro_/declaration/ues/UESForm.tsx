"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { config } from "@common/config";
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

export const UESForm = (props: PropsWithChildren) => {
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

    if (type === "ues") router.push(`${config.base_declaration_url}/ues`);
    else router.push(`${config.base_declaration_url}/periode-reference`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: "flex", gap: 10 }} className={fr.cx("fr-mt-4w")}>
        <Button type="reset" priority="secondary" disabled={isDirty}>
          Réinitialiser
        </Button>
        <Button disabled={!isValid}>Suivant</Button>
      </div>
    </form>
  );
};
