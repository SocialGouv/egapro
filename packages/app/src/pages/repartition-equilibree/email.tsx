import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { requestEmailForToken } from "@common/utils/api";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import { Alert, FormButton, FormGroup, FormGroupMessage, FormInput, FormLabel } from "@design-system";

const title = "Validation de l'email";

const ERROR_COLLAPSE_TIMEOUT = 5000;

const formSchema = z.object({
  email: z.string().min(1, "L'email est requis.").email({ message: "L'email est invalide." }),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

type FeatureStatus =
  | {
      message: string;
      type: "error";
    }
  | {
      type: "idle";
    }
  | {
      type: "loading";
    }
  | { message: string; type: "success" };

export default function EmailPage() {
  const [featureStatus, setFeatureStatus] = React.useState<FeatureStatus>({ type: "idle" });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted, isDirty, isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema as any), // Configuration the validation with the zod schema.
    defaultValues: {
      email: "",
    },
  });

  const email = watch("email");

  const onSubmit = async ({ email }: FormType) => {
    try {
      setFeatureStatus({ type: "loading" });
      await requestEmailForToken(email);
      setFeatureStatus({ type: "success", message: "Un mail vous a été envoyé." });
    } catch (error) {
      setFeatureStatus({ type: "error", message: "Erreur lors de l'envoi du mail" });
    }
  };

  // Remove error message after some timeout.
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (featureStatus.type === "error") {
      timeoutId = setTimeout(() => {
        setFeatureStatus({ type: "idle" });
      }, ERROR_COLLAPSE_TIMEOUT);
    }

    return () => clearTimeout(timeoutId);
  }, [featureStatus]);

  return (
    <>
      <h1>{title}</h1>

      {featureStatus.type === "error" ? (
        <Alert description={featureStatus.message} title="Erreur" type="error" />
      ) : featureStatus.type === "success" ? (
        <>
          <p>Un mail vous a été envoyé.</p>
          <p>
            Si vous ne recevez pas ce mail sous peu, il se peut que l'email saisi (<strong>{email}</strong>) soit
            incorrect, ou bien que le mail ait été déplacé dans votre dossier de courriers indésirables ou dans le
            dossier SPAM.
          </p>
          <p>En cas d'échec, la procédure devra être reprise avec un autre email.</p>
          <FormButton onClick={() => setFeatureStatus({ type: "idle" })}>Réessayer</FormButton>
        </>
      ) : (
        <>
          <p>
            Pour pouvoir poursuivre la transmission des informations requises, celui-ci doit correspondre à celui de la
            personne à contacter par les services de l’inspection du travail en cas de besoin et sera celui auquel sera
            adressé l’accusé de réception en fin de procédure.
          </p>
          <p>
            Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez saisir l’email utilisé
            pour la déclaration.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FormGroup>
              <FormLabel htmlFor="email">Adresse email</FormLabel>
              <FormInput id="email" {...register("email")} />
              {errors.email?.message && <FormGroupMessage id="email">{errors.email.message}</FormGroupMessage>}
            </FormGroup>

            <FormButton
              type="submit"
              isDisabled={featureStatus.type === "loading" || !isDirty || (isSubmitted && !isValid)}
            >
              Envoyer
            </FormButton>
          </form>
        </>
      )}
    </>
  );
}

EmailPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
