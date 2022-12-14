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
import { useUser } from "@services/apiClient";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "./_app";

type FormType = z.infer<typeof formSchema>;

const formSchema = z.object({
  askerEmail: z.string().email({ message: "L'adresse email est invalide." }),
  emails: z
    .string()
    .regex(
      /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,10})(,\s*([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,10}))*$/,
      { message: "L'adresse email est invalide." },
    ),
  sirens: z.string().regex(/^\d{9}(,\d{9})*$/, { message: "Le Siren est composé de 9 chiffres sans espace." }),
});

const AddDeclarer: NextPageWithLayout = () => {
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    reset({
      askerEmail: user?.email,
    });
  }, [reset, user?.email]);

  const onSubmit = async ({ askerEmail: user_email, emails, sirens }: FormType) => {
    console.log({ user_email: user_email, emails: emails.replace(/\s/g, "").split(","), sirens: sirens.split(",") });
  };

  return (
    <>
      <section>
        <Container py="8w">
          <Grid justifyCenter>
            <GridCol md={10} lg={8}>
              <h1>Demande d’ajout de nouveaux déclarants</h1>
              <p>
                Renseignez le(s) numéro(s) Siren ainsi que l'email du (des) déclarant(s) que vous souhaitez rattacher
                au(x) numéro(s) Siren.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormLayout>
                  <FormGroup isError={Boolean(errors.askerEmail)}>
                    <FormGroupLabel htmlFor="email">Email demandeur</FormGroupLabel>
                    <FormInput
                      aria-describedby={errors.askerEmail && "email-msg"}
                      id="email"
                      type="email"
                      {...register("askerEmail")}
                    />
                    {errors.askerEmail && (
                      <FormGroupMessage id="email-msg">{errors.askerEmail.message}</FormGroupMessage>
                    )}
                  </FormGroup>
                  <FormGroup isError={Boolean(errors.sirens)}>
                    <FormGroupLabel
                      htmlFor="sirens"
                      hint="Le numéro Siren se compose de 9 chiffres sans espace, il est possible d’ajouter plusieurs Siren séparées par des virgules sans espace."
                    >
                      Numéro(s) Siren
                    </FormGroupLabel>
                    <FormTextarea
                      aria-describedby={errors.sirens && "sirens-msg"}
                      id="sirens"
                      {...register("sirens")}
                    />
                    {errors.sirens && <FormGroupMessage id="sirens-msg">{errors.sirens.message}</FormGroupMessage>}
                  </FormGroup>
                  <FormGroup isError={Boolean(errors.emails)}>
                    <FormGroupLabel
                      htmlFor="emails"
                      hint="Il est possible d’ajouter plusieurs emails séparées par des virgules sans espace."
                    >
                      Email(s) déclarant(s)
                    </FormGroupLabel>
                    <FormTextarea
                      aria-describedby={errors.emails && "emails-msg"}
                      id="emails"
                      {...register("emails")}
                    />
                    {errors.emails && <FormGroupMessage id="emails-msg">{errors.emails.message}</FormGroupMessage>}
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
