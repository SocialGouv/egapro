import { AlertFeatureStatus, FeatureStatusProvider, useFeatureStatus } from "@components/FeatureStatusProvider";
import { BasicLayoutPublic } from "@components/layouts/BasicLayoutPublic";
import {
  Alert,
  Box,
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
import { putOwnershipRequest } from "@services/apiClient/ownershipRequest";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "./_app";

export type OwnershipRequestFormType = z.infer<typeof formSchema>;

const formSchema = z.object({
  askerEmail: z.string().email({ message: "L'adresse email est invalide." }),
  emails: z
    .string()
    .regex(
      /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,10})(,([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,10}))*$/,
      { message: "L'adresse email est invalide." },
    ),
  sirens: z.string().regex(/^\d{9}(,\d{9})*$/, { message: "Le Siren est composé de 9 chiffres sans espace." }),
});

const title = "Demande d’ajout de nouveaux déclarants";

const AddDeclarer: NextPageWithLayout = () => {
  const { user } = useUser();
  const { featureStatus, setFeatureStatus } = useFeatureStatus({ reset: true });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<OwnershipRequestFormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    reset({
      askerEmail: user?.email,
    });
  }, [reset, user?.email]);

  const onSubmit = async (formData: OwnershipRequestFormType) => {
    try {
      setFeatureStatus({ type: "loading" });
      await putOwnershipRequest(formData);
      setFeatureStatus({ type: "success", message: "La demande a été prise en compte." });
    } catch (error: unknown) {
      setFeatureStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Une erreur a été détectée lors de l'envoi de la demande.",
      });
    }
  };

  return (
    <section>
      <Container py="8w">
        <Grid justifyCenter>
          <GridCol md={10} lg={8}>
            <h1>{title}</h1>

            <AlertFeatureStatus type="error" title="Erreur" />

            {featureStatus.type === "success" ? (
              <>
                <p>
                  Votre demande a été transmise au service du ministre chargé du travail, elle sera traitée dans les
                  meilleurs délais.
                </p>
                <p>
                  Lors de la validation de votre demande par le service du ministre chargé du travail, vous recevrez un
                  mail de confirmation sur l’email demandeur que vous avez déclaré et validé en début de procédure.
                </p>
                <p>
                  Si vous ne recevez pas ce mail, merci de bien vérifier que celui-ci n’a pas été déplacé dans votre
                  dossier de courriers indésirables.
                </p>
                <Alert>
                  <p>
                    Le déclarant rattaché au numéro Siren de l'entreprise pourra ainsi ajouter ou supprimer un ou des
                    déclarants en se connectant à son espace avec son email. Vous trouverez ci-après la documentation
                    pour le faire.
                  </p>
                  <Box mt="2w">
                    <a href="/Procedure.pour.ajouter.ou.supprimer.declarants.pdf" target="_blank" rel="noreferrer">
                      Guide ajout déclarant (pdf)
                    </a>
                  </Box>
                </Alert>
              </>
            ) : (
              <>
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
                        hint="Le numéro Siren se compose de 9 chiffres sans espace, il est possible d’ajouter plusieurs Siren séparés par des virgules sans espace."
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
                        hint="Il est possible d’ajouter plusieurs emails séparés par des virgules sans espace."
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
              </>
            )}
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

AddDeclarer.getLayout = ({ children }) => {
  return (
    <BasicLayoutPublic title={title}>
      <FeatureStatusProvider>{children}</FeatureStatusProvider>
    </BasicLayoutPublic>
  );
};

export default AddDeclarer;
