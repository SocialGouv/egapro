import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateOwnershipRequestDTO } from "@common/core-domain/dtos/CreateOwnershipRequestDTO";
import { type ValidationError } from "@common/shared-domain";
import { getDuplicates } from "@common/utils/array";
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
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { NextLinkOrA } from "../design-system/utils/NextLinkOrA";
import { type NextPageWithLayout } from "./_app";

const zodUniqueEmailArray = z.string().transform((val, ctx) => {
  const splitted = val.split(",").map(v => v.trim());
  const messages: string[] = [];
  for (const v of splitted) {
    try {
      z.string().email().parse(v);
    } catch {
      messages.push(`L'adresse email "${v}" est invalide.`);
    }
  }

  if (messages.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: messages.join("\n"),
    });
    return z.NEVER;
  }

  const duplicates = getDuplicates(splitted);
  if (duplicates.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: duplicates.map(dup => `L'email "${dup}" ne doit pas être dupliqué dans la liste.`).join("\n"),
    });
    return z.NEVER;
  }

  return splitted;
});

const zodUniqueSirenArray = z.string().transform((val, ctx) => {
  const splitted = val.split(",").map(v => v.trim());
  const messages: string[] = [];
  for (let i = 0; i < splitted.length; i++) {
    try {
      new Siren(splitted[i]);
    } catch (error: unknown) {
      messages.push(`Pour l'élément ${i + 1} : ${(error as ValidationError).message}`);
    }
  }

  if (messages.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: messages.join("\n"),
    });
    return z.NEVER;
  }

  const duplicates = getDuplicates(splitted);
  if (duplicates.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: duplicates.map(dup => `Le Siren ${dup} ne doit pas être dupliqué dans la liste.`).join("\n"),
    });
    return z.NEVER;
  }

  return splitted;
});

const formSchema = z.object({
  askerEmail: z.string().email({ message: "L'adresse email est invalide." }),
  emails: zodUniqueEmailArray,
  sirens: zodUniqueSirenArray,
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
  } = useForm<z.input<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    reset({
      askerEmail: user?.email,
      emails: user?.email,
    });
  }, [reset, user?.email]);

  const onSubmit = async (formData: CreateOwnershipRequestDTO) => {
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
                  Lors de la validation de votre demande par le service du ministre chargé du travail, un mail de
                  confirmation sera envoyé au demandeur ainsi qu'au(x) déclarant(s) rattaché(s).
                </p>
                <p>
                  Si vous ne recevez pas ce mail, merci de bien vérifier que celui-ci n’a pas été déplacé dans votre
                  dossier de courriers indésirables.
                </p>
                <Alert>
                  <p>
                    Si vous n'avez pas reçu le mail de confirmation, il n'est pas nécessaire de nous contacter, vous
                    pouvez vérifier le rattachement de l'email du ou des déclarants en vous connectant à votre espace.
                  </p>
                  <p>Vous trouverez ci-après la documentation pour accéder à votre espace.</p>
                  <Box mt="2w">
                    <NextLinkOrA href="/Guide.Mon.Espace.pdf" target="_blank" rel="noreferrer" isExternal>
                      Guide Mon Espace (pdf)
                    </NextLinkOrA>
                  </Box>
                </Alert>
              </>
            ) : (
              <>
                <Alert mb="2w">
                  Si vous déclarez votre Index en tant qu'<b>unité économique et sociale (UES)</b>, vous devez faire une
                  demande <b>uniquement</b> pour le numéro Siren de l'entreprise déclarant pour le compte de l'UES
                  (cette entreprise doit être celle ayant effectué la déclaration les années précédentes).
                </Alert>
                <p>
                  Renseignez le(s) numéro(s) Siren ainsi que l'email du (des) déclarant(s) que vous souhaitez rattacher
                  au(x) numéro(s) Siren.
                </p>
                <form
                  onSubmit={handleSubmit(data => onSubmit(data as unknown as CreateOwnershipRequestDTO))}
                  noValidate
                >
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
                        hint="Le numéro Siren se compose de 9 chiffres sans espace, il est possible d’ajouter plusieurs Siren séparés par des virgules."
                      >
                        Numéro(s) Siren
                      </FormGroupLabel>
                      <FormTextarea
                        aria-describedby={errors.sirens && "sirens-msg"}
                        id="sirens"
                        {...register("sirens")}
                      />
                      {errors.sirens && (
                        <FormGroupMessage id="sirens-msg">
                          {errors.sirens.message?.split("\n").map((m, idx) => (
                            <Fragment key={`sirens-error-${idx}`}>
                              {m}
                              <br />
                            </Fragment>
                          ))}
                        </FormGroupMessage>
                      )}
                    </FormGroup>
                    <FormGroup isError={Boolean(errors.emails)}>
                      <FormGroupLabel
                        htmlFor="emails"
                        hint="Il est possible d’ajouter plusieurs emails séparés par des virgules."
                      >
                        Email(s) déclarant(s)
                      </FormGroupLabel>
                      <FormTextarea
                        aria-describedby={errors.emails && "emails-msg"}
                        id="emails"
                        {...register("emails")}
                      />
                      {errors.emails && (
                        <FormGroupMessage id="emails-msg">
                          {errors.emails.message?.split("\n").map((m, idx) => (
                            <Fragment key={`emails-error-${idx}`}>
                              {m}
                              <br />
                            </Fragment>
                          ))}
                        </FormGroupMessage>
                      )}
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
