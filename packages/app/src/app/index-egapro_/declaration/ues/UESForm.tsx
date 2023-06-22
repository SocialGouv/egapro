"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { config } from "@common/config";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
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
  const { formData, savePageData, resetFormData } = useDeclarationFormManager();
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
    // savePageData("ues", data as DeclarationFormState["ues"]);

    router.push(`${config.base_declaration_url}/remuneration`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ButtonsGroup
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Précédent",
            priority: "secondary",
            onClick: () => router.push(`${config.base_declaration_url}/entreprise`),
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
