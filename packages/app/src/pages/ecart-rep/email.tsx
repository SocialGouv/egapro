import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";
import type { FeatureStatus } from "@common/utils/feature";
import { ClientOnly } from "@components/ClientOnly";
import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";
import {
  Alert,
  AlertTitle,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
} from "@design-system";
import { requestEmailForToken, useUser } from "@services/apiClient";

const title = "Validation de l'email";

const ERROR_COLLAPSE_TIMEOUT = 5000;

const formSchema = z.object({
  email: z.string().min(1, "L'adresse mail est requise.").email({ message: "L'adresse mail est invalide." }),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const informationMessage =
  "En cas d'email erroné, vous ne pourrez pas remplir le formulaire ou accéder à votre déclaration déjà transmise.";

const EmailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>({ type: "idle" });
  // Si la personne est authentifiée, on reroute sur commencer.
  if (user) router.push("/ecart-rep/commencer");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted, isDirty, isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema), // Configuration the validation with the zod schema.
    defaultValues: {
      email: "",
    },
  });

  // Remove error message after some timeout.
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (featureStatus.type === "error") {
      timeoutId = setTimeout(() => {
        setFeatureStatus({ type: "idle" });
      }, ERROR_COLLAPSE_TIMEOUT);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [featureStatus, setFeatureStatus]);

  const email = watch("email");

  const onSubmit = async ({ email }: FormType) => {
    try {
      setFeatureStatus({ type: "loading" });
      await requestEmailForToken(email, `${window.location.origin}/ecart-rep/commencer?token=`);
      setFeatureStatus({ type: "success", message: "Un mail vous a été envoyé." });
    } catch (error) {
      setFeatureStatus({
        type: "error",
        message: "Erreur lors de l'envoi de l'email, veuillez vérifier que l'adresse est correcte.",
      });
    }
  };

  return (
    <>
      <h1>{title}</h1>

      <ClientOnly>
        {featureStatus.type !== "success" && (
          <>
            <Alert type="info">
              <AlertTitle>Information</AlertTitle>
              <p>{informationMessage}</p>
            </Alert>
            <br />
          </>
        )}

        {featureStatus.type === "error" && (
          <>
            <Alert type="error">
              <AlertTitle>Erreur</AlertTitle>
              <p>{featureStatus.message}</p>
            </Alert>
            <br />
          </>
        )}

        {featureStatus.type === "success" && (
          <>
            <p>Vous allez recevoir un mail sur l'adresse mail que vous avez indiquée à l'étape précédente.</p>

            <p>
              <strong>Ouvrez ce mail et cliquez sur le lien de validation.</strong>
            </p>
            <p>
              Si vous ne recevez pas ce mail sous peu, il se peut que l'email saisi (<strong>{email}</strong>) soit
              incorrect, ou bien que le mail ait été déplacé dans votre dossier de courriers indésirables ou dans le
              dossier SPAM.
            </p>
            <p>En cas d'échec, la procédure devra être reprise avec un autre email.</p>
            <FormButton onClick={() => setFeatureStatus({ type: "idle" })}>Réessayer</FormButton>
          </>
        )}

        {featureStatus.type !== "success" && (
          <>
            <p>
              L'email doit correspondre à celui de la personne à contacter par les services de l’inspection du travail
              en cas de besoin et sera celui sur lequel sera adressé l’accusé de réception en fin de déclaration.
            </p>
            <p>
              Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez saisir l'email utilisé
              pour la déclaration ou un des emails rattachés au Siren de votre entreprise.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormLayout>
                <FormGroup>
                  <FormGroupLabel htmlFor="email">Adresse email</FormGroupLabel>
                  <FormInput aria-describedby="email-msg" id="email" type="email" {...register("email")} />
                  {errors.email?.message && <FormGroupMessage id="email-msg">{errors.email.message}</FormGroupMessage>}
                </FormGroup>
                <FormLayoutButtonGroup>
                  <FormButton
                    type="submit"
                    isDisabled={featureStatus.type === "loading" || !isDirty || (isSubmitted && !isValid)}
                  >
                    Envoyer
                  </FormButton>
                </FormLayoutButtonGroup>
              </FormLayout>
            </form>
          </>
        )}
      </ClientOnly>
    </>
  );
};

EmailPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeStartLayout>{children}</RepartitionEquilibreeStartLayout>;
};

export default EmailPage;
