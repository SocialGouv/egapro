"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { REGEX_EMAIL } from "@common/shared-domain/domain/valueObjects";
import { AlertFeatureStatus, useFeatureStatus } from "@components/utils/FeatureStatusProvider";
import { Container } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise.")
    .regex(REGEX_EMAIL, { message: "L'adresse email est invalide." }),
});

type FormType = z.infer<typeof formSchema>;

export interface EmailAuthticatorProps {
  callbackUrl: string;
}
export const EmailLogin = ({ callbackUrl }: EmailAuthticatorProps) => {
  const { featureStatus, setFeatureStatus } = useFeatureStatus();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const email = watch("email");

  const onSubmit = async ({ email }: FormType) => {
    try {
      setFeatureStatus({ type: "loading" });
      const result = await signIn("email", { email, callbackUrl, redirect: false });
      if (result?.ok) {
        setFeatureStatus({ type: "success", message: "Un email vous a été envoyé." });
      } else {
        setFeatureStatus({
          type: "error",
          message: `Erreur lors de l'envoi de l'email. (${result?.status}) ${result?.error}`,
        });
      }
    } catch (error) {
      setFeatureStatus({
        type: "error",
        message: "Erreur lors de l'envoi de l'email, veuillez vérifier que l'adresse est correcte.",
      });
    }
  };

  return (
    <>
      <AlertFeatureStatus title="Erreur" type="error" />

      {featureStatus.type === "success" && (
        <>
          <p>Vous allez recevoir un mail sur l'adresse email que vous avez indiquée à l'étape précédente.</p>

          <p>
            <strong>Ouvrez ce mail et cliquez sur le lien de validation.</strong>
          </p>
          <p>
            Si vous ne recevez pas ce mail sous peu, il se peut que l'email saisi (<strong>{email}</strong>) soit
            incorrect, ou bien que le mail ait été déplacé dans votre dossier de courriers indésirables ou dans le
            dossier SPAM.
          </p>
          <p>En cas d'échec, la procédure devra être reprise avec un autre email.</p>

          <Button onClick={() => setFeatureStatus({ type: "idle" })} className={fr.cx("fr-mt-4w")}>
            Réessayer
          </Button>
        </>
      )}

      {featureStatus.type !== "success" && (
        <>
          <Alert
            severity="info"
            title="Attention"
            description="En cas d'email erroné, vous ne pourrez pas remplir le formulaire ou accéder à votre déclaration déjà transmise."
          />

          <p className={fr.cx("fr-mt-4w")}>
            Pour pouvoir permettre de poursuivre la transmission des informations requises, l’email doit correspondre à
            celui de la personne à contacter par les services de l’inspection du travail en cas de besoin et sera celui
            sur lequel sera adressé l’accusé de réception en fin de procédure.
          </p>

          <p>
            Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez saisir l'email utilisé
            pour la déclaration.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Container fluid mt="4w">
              <Input
                label="Adresse email"
                state={errors.email?.message ? "error" : "default"}
                stateRelatedMessage={errors.email?.message}
                nativeInputProps={{
                  ...register("email"),
                  type: "email",
                  spellCheck: false,
                  autoComplete: "email",
                  placeholder: "Exemple : nom@domaine.fr",
                }}
              />
              <Button disabled={featureStatus.type === "loading" || !isValid}>Envoyer</Button>
            </Container>
          </form>
        </>
      )}
    </>
  );
};
