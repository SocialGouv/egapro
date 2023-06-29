"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { type PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { funnelConfig, type FunnelKey } from "../../declarationFunnelConfiguration";
import { BackNextButtons } from "../BackNextButtons";

const formSchema = z.object({
  name: z.string(), // No extra control needed because this is a radio button with options we provide.
  sirens: z.array(z.string()), // No extra control needed because this is a radio button with options we provide.
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "ues";

export const UESForm = (props: PropsWithChildren) => {
  const { formData, savePageData, resetFormData } = useDeclarationFormManager();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: formData.ues,
  });

  const onSubmit = async (data: FormType) => {
    savePageData("ues", data);

    router.push(funnelConfig(formData)[stepName].next().url);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* TODO  */}
      <BackNextButtons stepName={stepName} disabled={!isValid} />
    </form>
  );
};
