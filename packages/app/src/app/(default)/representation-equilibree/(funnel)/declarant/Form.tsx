"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { type ClearObject } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

const formSchema = createSteps.declarant.extend({
  gdpr: z.boolean().refine(gdpr => gdpr, "L'accord est requis"),
});

type DeclarantFormType = ClearObject<z.infer<typeof formSchema>>;

const useStore = storePicker(useRepeqFunnelStore);
export const DeclarantForm = ({ session }: { session: Session }) => {
  const router = useRouter();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const hydrated = useRepeqFunnelStoreHasHydrated();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DeclarantFormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...session.user, // first fill with session info (email, username, ...)
      ...funnel, // then, if funnel has data, get them
    },
  });

  if (!hydrated) {
    return <SkeletonForm fields={5} />;
  }

  const onSubmit = async (form: DeclarantFormType) => {
    saveFunnel(form);
    router.push("/representation-equilibree/entreprise");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormLayout>
        <Input
          label="Nom du déclarant"
          state={errors.lastname && "error"}
          stateRelatedMessage={errors.lastname?.message}
          nativeInputProps={{
            ...register("lastname"),
          }}
        />
        <Input
          label="Prénom du déclarant"
          state={errors.firstname && "error"}
          stateRelatedMessage={errors.firstname?.message}
          nativeInputProps={{
            ...register("firstname"),
          }}
        />
        <Input
          label="Numéro de téléphone"
          state={errors.phoneNumber && "error"}
          stateRelatedMessage={errors.phoneNumber?.message}
          nativeInputProps={{
            ...register("phoneNumber"),
            minLength: 10,
            maxLength: 10,
          }}
        />
        <Input
          label="Email"
          hintText="Saisi lors de l'authentification"
          nativeInputProps={{
            ...register("email"),
            type: "email",
            readOnly: true,
          }}
        />
        <Checkbox
          options={[
            {
              label:
                "J'accepte l'utilisation de mes données à caractère personnel pour réaliser des statistiques et pour vérifier la validité de ma déclaration.",
              hintText: (
                <>
                  Pour en savoir plus sur l'usage de ces données, vous pouvez consulter nos{" "}
                  <Link href="/cgu" target="_blank">
                    Conditions Générales d'Utilisation
                  </Link>
                  .
                </>
              ),
              nativeInputProps: {
                ...register("gdpr"),
              },
            },
          ]}
          state={errors.gdpr && "error"}
          stateRelatedMessage={errors.gdpr?.message}
        />
        <ButtonsGroup
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              children: "Précédent",
              linkProps: {
                href: "/representation-equilibree/commencer",
              },
              priority: "secondary",
            },
            {
              children: "Suivant",
              type: "submit",
              disabled: !isValid,
            },
          ]}
        />
      </FormLayout>
    </form>
  );
};
