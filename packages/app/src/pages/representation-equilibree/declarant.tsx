import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";
import { ClientOnly } from "@components/ClientOnly";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import {
  ButtonAsLink,
  FormButton,
  FormCheckbox,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
} from "@design-system";
import { useFormManager, useUser } from "@services/apiClient";

const formSchema = z.object({
  nom: z.string().min(1, { message: "Le nom est requis" }),
  prenom: z.string().min(1, { message: "Le prénom est requis" }),
  telephone: z
    .string()
    .min(1, { message: "Le téléphone est requis" })
    .regex(/\d{10}/gi, "Le numéro de téléphone doit être composé de 10 chiffres"),
  email: z.string().email(),
  accord_rgpd: z.boolean().refine(accord_rgpd => accord_rgpd, { message: "L'accord est requis" }),
});

type FormType = z.infer<typeof formSchema>;

const DeclarantPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: "/representation-equilibree/email" });
  const { formData, saveFormData } = useFormManager();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    // Using defaultValues would not be enough here, because we fetch user.email asynchronously and so it is not present at rehydration time. So we use reset API below.
  });

  const resetAsyncForm = useCallback(async () => {
    reset({
      nom: formData?.declarant?.nom,
      prenom: formData?.declarant?.prenom,
      telephone: formData?.declarant?.telephone,
      accord_rgpd: formData?.declarant?.accord_rgpd,
      email: user?.email,
    });
  }, [
    formData?.declarant?.accord_rgpd,
    formData?.declarant?.nom,
    formData?.declarant?.prenom,
    formData?.declarant?.telephone,
    reset,
    user?.email,
  ]);

  useEffect(() => {
    resetAsyncForm();
  }, [resetAsyncForm]);

  const onSubmit = async ({ nom, prenom, telephone, email, accord_rgpd }: FormType) => {
    saveFormData({ declarant: { prenom: prenom, nom: nom, telephone: telephone, email, accord_rgpd } });
    router.push("/representation-equilibree/entreprise");
  };

  return (
    <>
      <p>
        <b>Renseignez le nom du déclarant, ainsi que son prénom et numéro de téléphone.</b>
      </p>

      <ClientOnly>
        <FormLayout>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormGroup>
              <FormGroupLabel htmlFor="nom">Nom du déclarant</FormGroupLabel>
              <FormInput
                id="nom"
                type="text"
                isError={Boolean(errors.nom)}
                {...register("nom")}
                aria-describedby={errors.nom && "nom-message-error"}
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
                aria-describedby={errors.prenom && "prenom-message-error"}
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
                aria-describedby={errors.telephone && "telephone-message-error"}
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
              <FormCheckbox
                id="accord_rgpd"
                {...register("accord_rgpd")}
                aria-describedby={errors.accord_rgpd && "accord_rgpd-message-error"}
              >
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
              <NextLink href="/representation-equilibree/commencer" passHref>
                <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
              </NextLink>
              <FormButton isDisabled={!isValid}>Suivant</FormButton>
            </FormLayoutButtonGroup>
          </form>
        </FormLayout>
      </ClientOnly>
    </>
  );
};

DeclarantPage.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout>{children}</RepresentationEquilibreeLayout>;
};

export default DeclarantPage;
