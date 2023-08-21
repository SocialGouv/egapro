"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodEmail, zodPhone } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { type PropsWithChildren } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "declarant";

type Props = {
  session: Session;
};

const formSchema = zodFr.object({
  accordRgpd: z.boolean().refine(val => !!val, {
    message: "Vous devez accepter les conditions pour continuer",
  }),
  email: zodEmail,
  nom: z.string().nonempty("Le nom est obligatoire"),
  prénom: z.string().nonempty("Le prénom est obligatoire"),
  téléphone: zodPhone,
});

type FormType = z.infer<typeof formSchema>;

export const DeclarantForm = ({ session }: PropsWithChildren<Props>) => {
  const user = session.user;
  const router = useRouter();

  const { formData, savePageData } = useDeclarationFormManager();

  const methods = useForm<FormType>({
    mode: "onBlur",
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
    savePageData(stepName, data);

    router.push(funnelConfig(formData)[stepName].next().url);
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onsubmit)}>
          {/* <ReactHookFormDebug /> */}

          <p>
            Renseignez le nom, le prénom et le numéro de téléphone du déclarant pour tout contact ultérieur par les
            services de l’inspection du travail.
          </p>

          <Input
            label="Prénom du déclarant"
            nativeInputProps={{ ...register("prénom") }}
            state={errors.prénom ? "error" : "default"}
            stateRelatedMessage={errors.prénom?.message}
          />
          <Input
            label="Nom du déclarant"
            nativeInputProps={{ ...register("nom") }}
            state={errors.nom ? "error" : "default"}
            stateRelatedMessage={errors.nom?.message}
          />

          <Input
            label="Numéro de téléphone"
            hintText="Format attendu : 01 22 33 44 55"
            nativeInputProps={{ ...register("téléphone") }}
            state={errors.téléphone ? "error" : "default"}
            stateRelatedMessage={errors.téléphone?.message}
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
