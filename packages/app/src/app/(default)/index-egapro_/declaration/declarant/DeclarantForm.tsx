"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { ReactHookFormDebug } from "@components/RHF/ReactHookFormDebug";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useSession } from "next-auth/react";
import { type PropsWithChildren } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "declarant";

type Props = {};

const formSchema = z.object({
  accordRgpd: z.boolean().refine(val => !!val, {
    message: "Vous devez accepter les conditions pour continuer",
  }),
  email: z.string(),
  nom: z.string(),
  prénom: z.string(),
  téléphone: z.string(),
});

type FormType = z.infer<typeof formSchema>;

export const DeclarantForm = (props: PropsWithChildren<Props>) => {
  const session = useSession();

  const user = session.data?.user;

  const { formData, savePageData } = useDeclarationFormManager();

  console.log("user:", user);
  console.log("formData:", formData[stepName]);

  const methods = useForm<FormType>({
    shouldUnregister: true, // Don't store the fields that are not displayed.
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: formData[stepName]?.nom || user?.lastname,
      prénom: formData[stepName]?.prénom || user?.firstname,
      email: formData[stepName]?.email || user?.email,
      téléphone: formData[stepName]?.téléphone || "",
      accordRgpd: formData[stepName]?.accordRgpd || false,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = methods;

  const onsubmit = async (data: FormType) => {
    console.log("dans onSubmit");
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onsubmit)}>
          <ReactHookFormDebug />

          <p>
            Renseignez le nom, le prénom et le numéro de téléphone du déclarant pour tout contact ultérieur par les
            services de l’inspection du travail.
          </p>

          <Input label="Prénom du déclarant" nativeInputProps={{ ...register("prénom") }} />
          <Input label="Nom du déclarant" nativeInputProps={{ ...register("nom") }} />

          <Input
            label="Numéro de téléphone"
            hintText="Format attendu : 01 22 33 44 55"
            nativeInputProps={{ ...register("téléphone") }}
          />

          <Input label="Email du déclarant" disabled={true} nativeInputProps={{ ...register("email") }} />

          <Checkbox
            options={[
              {
                label:
                  "J'accepte l'utilisation de mes données à caractère personnel pour réaliser des statistiques et pour vérifier la validité de ma déclaration.",

                nativeInputProps: {
                  ...register("accordRgpd"),
                },
                hintText:
                  "Pour en savoir plus sur l'usage de ces données, vous pouvez consulter nos Conditions Générales d'Utilisation.",
              },
            ]}
            state={errors.accordRgpd ? "error" : "default"}
            stateRelatedMessage={errors.accordRgpd?.message}
          />

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </form>
      </FormProvider>
    </>
  );
};
