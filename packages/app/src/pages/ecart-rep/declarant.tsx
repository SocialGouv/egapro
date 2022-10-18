import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";
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

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const DeclarantPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { email } = useUser();
  const { formData, saveFormData } = useFormManager();

  // useEffect(() => {
  //   if (!isAuthenticated) router.push("/ecart-rep/email");
  // }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: email,
    },
  });

  // useEffect(() => {
  //   if (email) {
  //     setValue("email", email);
  //   }
  // }, [email, setValue]);

  const resetAsyncForm = useCallback(async () => {
    reset({
      email,
      nom: formData?.declarant?.nom,
      prenom: formData?.declarant?.prenom,
      telephone: formData?.declarant?.telephone,
      accord_rgpd: formData?.declarant?.accord_rgpd,
    });
  }, [reset, formData, email]);

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
              consulter nos <a href="#">Conditions Générales d'Utilisation</a>.
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
    </>
  );
};

DeclarantPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeStartLayout>{children}</RepartitionEquilibreeStartLayout>;
};

export default DeclarantPage;
