"use client";

import { zodEmail, zodPhone } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { DeclarantFields } from "@components/RHF/DeclarantFields";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { type PropsWithChildren } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "declarant";

type Props = {
  session: Session;
};

const formSchema = zodFr.object({
  accordRgpd: z.boolean().refine(val => val, "Vous devez accepter les conditions pour continuer"),
  email: zodEmail,
  nom: z.string().trim().nonempty("Le nom est obligatoire"),
  prénom: z.string().trim().nonempty("Le prénom est obligatoire"),
  téléphone: zodPhone,
});

type FormType = z.infer<typeof formSchema>;

export const DeclarantForm = ({ session }: PropsWithChildren<Props>) => {
  const user = session.user;
  const router = useRouter();

  const { formData, savePageData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  const methods = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: formData[stepName]?.nom || user?.lastname,
      prénom: formData[stepName]?.prénom || user?.firstname,
      email: formData[stepName]?.email || user?.email,
      téléphone: formData[stepName]?.téléphone || user?.phoneNumber,
      accordRgpd: true,
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = methods;

  const onsubmit = async (data: FormType) => {
    savePageData(stepName, data);

    router.push(funnelConfig(formData)[stepName].next().url);
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onsubmit)}>
          <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
          <FormLayout>
            <ClientOnly fallback={<SkeletonForm fields={3} />}>
              <DeclarantFields<FormType>
                isStaff={session.user.staff}
                email="email"
                firstname="prénom"
                lastname="nom"
                phoneNumber="téléphone"
              />
            </ClientOnly>

            <BackNextButtons stepName={stepName} disabled={!isValid} />
          </FormLayout>
        </form>
      </FormProvider>
    </>
  );
};
