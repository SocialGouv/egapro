import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUser } from "../../hooks/useUser";
import { useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
import { ClientAuthenticatedOnly } from "@components/ClientAuthenticatedOnly";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  FormButton,
  FormCheckbox,
  FormGroup,
  FormGroupLabel,
  FormInput,
  FormGroupMessage,
  FormLayout,
  FormLayoutButtonGroup,
} from "@design-system";

const title = "Informations déclarant";

const formSchema = z.object({
  nom: z.string().min(1, { message: "Le nom est requis" }),
  prenom: z.string().min(1, { message: "Le prénom est requis" }),
  telephone: z
    .string()
    .min(1, { message: "Le téléphone est requis" })
    .regex(/\d{10}/gi, "Le téléphone doit être composé de 10 chiffres"),
  email: z.string().email(),
  accord_rgpd: z.boolean().refine(accord_rgpd => accord_rgpd, { message: "L'accord est requis" }),
});

type FormType = z.infer<typeof formSchema>;

const DeclarantPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: "/ecart-rep/email" });
  const { formData, saveFormData } = useFormManager();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email,
    },
  });

  const resetAsyncForm = useCallback(async () => {
    reset({
      email: user?.email,
      nom: formData?.declarant?.nom,
      prenom: formData?.declarant?.prenom,
      telephone: formData?.declarant?.telephone,
      accord_rgpd: formData?.declarant?.accord_rgpd,
    });
  }, [reset, formData, user?.email]);

  useEffect(() => {
    resetAsyncForm();
  }, [resetAsyncForm]);

  const onSubmit = async ({ nom, prenom, telephone, email, accord_rgpd }: FormType) => {
    saveFormData({ declarant: { prenom: prenom, nom: nom, telephone: telephone, email, accord_rgpd } });
    router.push("/ecart-rep/entreprise");
  };

  return (
    <>
      <h1>{title}</h1>
      <p>Renseignez le nom du déclarant, ainsi que son prénom et numéro de téléphone</p>

      <ClientAuthenticatedOnly>
        <FormLayout>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormGroup>
              <FormGroupLabel htmlFor="nom">Nom du déclarant</FormGroupLabel>
              <FormInput
                id="nom"
                type="text"
                isError={Boolean(errors.nom)}
                {...register("nom")}
                aria-describedby="nom-message-error"
              />
              {errors.nom && <FormGroupMessage id="nom-message-error">{errors.nom.message}</FormGroupMessage>}
            </FormGroup>
            <FormGroup>
              <FormGroupLabel htmlFor="prenom">Prénom du déclarant</FormGroupLabel>
              <FormInput
                id="prenom"
                type="text"
                isError={Boolean(errors.prenom)}
                {...register("prenom")}
                aria-describedby="prenom-message-error"
              />
              {errors.prenom && <FormGroupMessage id="prenom-message-error">{errors.prenom.message}</FormGroupMessage>}
            </FormGroup>
            <FormGroup>
              <FormGroupLabel htmlFor="telephone">Numéro de téléphone</FormGroupLabel>
              <FormInput
                id="telephone"
                type="tel"
                isError={Boolean(errors.telephone)}
                {...register("telephone")}
                aria-describedby="telephone-message-error"
              />
              {errors.telephone && (
                <FormGroupMessage id="telephone-message-error">{errors.telephone.message}</FormGroupMessage>
              )}
            </FormGroup>
            <FormGroup>
              <FormGroupLabel htmlFor="email">Email</FormGroupLabel>
              <FormInput id="email" type="text" readOnly {...register("email")} />
            </FormGroup>
            <FormGroup>
              <FormCheckbox id="accord_rgpd" {...register("accord_rgpd")} aria-describedby="accord_rgpd-message-error">
                J'accepte l'utilisation de mes données à caractère personnel pour réaliser des statistiques et pour
                vérifier la validité de ma déclaration. Pour en savoir plus sur l'usage de ces données, vous pouvez
                consulter nos{" "}
                <NextLink href="/cgu">
                  <a>Conditions Générales d'Utilisation</a>
                </NextLink>
                .
              </FormCheckbox>
              {errors.accord_rgpd && (
                <FormGroupMessage id="accord_rgpd-message-error">{errors.accord_rgpd.message}</FormGroupMessage>
              )}
            </FormGroup>
            <FormLayoutButtonGroup>
              <FormButton type="button" variant="secondary" onClick={() => router.push("/ecart-rep/commencer")}>
                Précédent
              </FormButton>
              <FormButton isDisabled={!isValid}>Suivant</FormButton>
            </FormLayoutButtonGroup>
          </form>
        </FormLayout>
      </ClientAuthenticatedOnly>
    </>
  );
};

DeclarantPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default DeclarantPage;
