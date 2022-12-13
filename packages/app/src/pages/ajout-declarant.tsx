import { BasicLayout } from "@components/layouts/BasicLayout";
import {
  Container,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormTextarea,
  Grid,
  GridCol,
} from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormManager, useUser } from "@services/apiClient";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "./_app";

type FormType = z.infer<typeof formSchema>;

const formSchema = z.object({
  user_email: z.string().email({ message: "L'adresse email est invalide." }),
  email: z
    .string()
    .regex(
      /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,10})(,\s*([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,10}))*$/,
      { message: "L'adresse email est invalide." },
    ),
  siren: z.string().regex(/^\d{9}(,\d{9})*$/, { message: "Le Siren est composé de 9 chiffres sans espace." }),
});

const AddDeclarer: NextPageWithLayout = () => {
  const { user } = useUser();
  const { formData, saveFormData } = useFormManager();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });

  const resetAsyncForm = useCallback(async () => {
    reset({
      siren: formData?.entreprise?.siren,
      user_email: user?.email,
      email: formData?.declarant?.email,
    });
  }, [formData?.declarant?.email, formData?.entreprise?.siren, reset, user?.email]);

  useEffect(() => {
    resetAsyncForm();
  }, [resetAsyncForm]);

  const onSubmit = async ({ user_email, email, siren }: FormType) => {
    saveFormData({
      declarant: { email: email.trim(), accord_rgpd: false, nom: "", prenom: "", telephone: "" },
      entreprise: { siren: siren.trim() },
    });
    console.log({ user_email: user_email, email: email.replace(/\s/g, "").split(","), siren: siren.split(",") });
  };

  return (
    <>
      <section>
        <Container py="8w">
          <Grid justifyCenter>
            <GridCol md={10} lg={8}>
              <h1>Demande d’ajout de nouveaux déclarants</h1>
              <p>
                Écrire un texte explicatif sur la procédure d’ajout de nouveaux déclarants. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Sed iaculis eu erat eu placerat. Phasellus eleifend malesuada odio eget
                consectetur.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormLayout>
                  <FormGroup isError={Boolean(errors.user_email)}>
                    <FormGroupLabel htmlFor="email">Adresse email</FormGroupLabel>
                    <FormInput aria-describedby={"email-msg"} id="email" type="email" {...register("user_email")} />
                    {errors.user_email && (
                      <FormGroupMessage id="nom-message-error">{errors.user_email.message}</FormGroupMessage>
                    )}
                  </FormGroup>
                  <FormGroup isError={Boolean(errors.siren)}>
                    <FormGroupLabel
                      htmlFor="siren"
                      hint="Le numéro Siren se compose de 9 chiffres sans espace, il est possible d’ajouter plusieurs Siren séparées par des virgules sans espace."
                    >
                      Numéro(s) Siren
                    </FormGroupLabel>
                    <FormTextarea aria-describedby={"siren-msg"} id="siren" {...register("siren")} />
                    {errors.siren && <FormGroupMessage id="nom-message-error">{errors.siren.message}</FormGroupMessage>}
                  </FormGroup>
                  <FormGroup isError={Boolean(errors.email)}>
                    <FormGroupLabel
                      htmlFor="declarer-email"
                      hint="Il est possible d’ajouter plusieurs emails séparées par des virgules sans espace."
                    >
                      emails
                    </FormGroupLabel>
                    <FormTextarea aria-describedby={"declarer-email-msg"} id="declarer-email" {...register("email")} />
                    {errors.email && <FormGroupMessage id="nom-message-error">{errors.email.message}</FormGroupMessage>}
                  </FormGroup>
                  <FormLayoutButtonGroup>
                    <FormButton isDisabled={!isValid}>Envoyer ma demande</FormButton>
                  </FormLayoutButtonGroup>
                </FormLayout>
              </form>
            </GridCol>
          </Grid>
        </Container>
      </section>
    </>
  );
};

AddDeclarer.getLayout = ({ children }) => {
  return <BasicLayout title="Demande d’ajout de nouveaux déclarants">{children}</BasicLayout>;
};

export default AddDeclarer;
