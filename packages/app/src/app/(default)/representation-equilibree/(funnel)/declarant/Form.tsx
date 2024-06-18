"use client";

import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { type ClearObject } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { DeclarantFields } from "@components/RHF/DeclarantFields";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

const formSchema = createSteps.declarant;

type DeclarantFormType = ClearObject<z.infer<typeof formSchema>>;

const useStore = storePicker(useRepeqFunnelStore);
export const DeclarantForm = ({ session }: { session: Session }) => {
  const router = useRouter();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel", "isEdit");
  const hydrated = useRepeqFunnelStoreHasHydrated();

  const methods = useForm<DeclarantFormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      gdpr: true,
      ...session.user, // first fill with session info (email, username, ...)
      ...funnel, // then, if funnel has data, get them
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = methods;

  if (!hydrated) {
    return <SkeletonForm fields={5} />;
  }

  if (!funnel?.year) {
    redirect("/representation-equilibree/commencer");
  }

  const onSubmit = async (form: DeclarantFormType) => {
    saveFunnel(form);
    router.push("/representation-equilibree/entreprise");
  };
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
        <FormLayout>
          <DeclarantFields<DeclarantFormType>
            isStaff={session.user.staff}
            email="email"
            firstname="firstname"
            lastname="lastname"
            phoneNumber="phoneNumber"
          />

          <BackNextButtonsGroup
            backProps={{
              linkProps: {
                href: "/representation-equilibree/commencer",
              },
            }}
            nextDisabled={!isValid}
          />
        </FormLayout>
      </form>
    </FormProvider>
  );
};
