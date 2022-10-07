import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";
import { FormButton, FormGroup, FormGroupLabel, FormInput, FormGroupMessage } from "@design-system";
const title = "Informations déclarant";

const formSchema = z.object({
  nom: z.string().min(1, { message: "Le nom est requis" }),
  prenom: z.string().min(1, { message: "Le prénom est requis" }),
  telephone: z.string().min(1, { message: "Le téléphone est requis" }),
  email: z.string().email(),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

export default function DeclarantPage() {
  const router = useRouter();

  const { email } = useUser();

  // React.useEffect(() => {
  //   if (!isAuthenticated) router.push("/ecart-rep/email");
  // }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      email: email,
    },
  });

  React.useEffect(() => {
    if (email) {
      setValue("email", email);
    }
  }, [email, setValue]);

  const onSubmit = async ({ nom, prenom, telephone, email }: FormType) => {
    router.push("/ecart-rep/declarant");
  };

  return (
    <>
      <h1>{title}</h1>
      <p>Renseignez le nom du déclarant, ainsi que son prénom, numéro de téléphone et email</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormGroup>
          <FormGroupLabel htmlFor="nom">Nom du déclarant</FormGroupLabel>
          <FormInput id="nom" type="text" isError={Boolean(errors.nom)} {...register("nom")} />
          {errors.nom && <FormGroupMessage id="nom-message-error">{errors.nom.message}</FormGroupMessage>}
        </FormGroup>
        <FormGroup>
          <FormGroupLabel htmlFor="prenom">Prénom du déclarant</FormGroupLabel>
          <FormInput id="prenom" type="text" isError={Boolean(errors.prenom)} {...register("prenom")} />
          {errors.prenom && <FormGroupMessage id="prenom-message-error">{errors.prenom.message}</FormGroupMessage>}
        </FormGroup>
        <FormGroup>
          <FormGroupLabel htmlFor="telephone">Numéro de téléphone</FormGroupLabel>
          <FormInput id="telephone" type="text" isError={Boolean(errors.telephone)} {...register("telephone")} />
          {errors.telephone && (
            <FormGroupMessage id="telephone-message-error">{errors.telephone.message}</FormGroupMessage>
          )}
        </FormGroup>
        <FormGroup>
          <FormGroupLabel htmlFor="email">Email</FormGroupLabel>
          <FormInput id="email" type="text" readOnly {...register("email")} />
        </FormGroup>
        <FormButton isDisabled={!isValid || !isDirty}>Valider les informations</FormButton>
      </form>
    </>
  );
}

DeclarantPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeStartLayout>{page}</RepartitionEquilibreeStartLayout>;
};
