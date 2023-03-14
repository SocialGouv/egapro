import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { normalizeRouterQuery } from "@common/utils/url";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestEmailForToken } from "@services/apiClient";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AlertFeatureStatus, useFeatureStatus } from "./FeatureStatusProvider";

const formSchema = z.object({
  email: z.string().min(1, "L'adresse email est requise.").email({ message: "L'adresse email est invalide." }),
});

type FormType = z.infer<typeof formSchema>;

type Props = { defaultRedirectTo: string };

export const EmailAuthenticator = ({ defaultRedirectTo }: Props) => {
  const router = useRouter();
  const { featureStatus, setFeatureStatus } = useFeatureStatus();
  const { redirectTo } = normalizeRouterQuery(router.query);

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
      await requestEmailForToken(email, `${new URL(redirectTo || defaultRedirectTo, window.location.origin)}?token=`);
      setFeatureStatus({ type: "success", message: "Un email vous a été envoyé." });
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
            <div
              className={fr.cx("fr-container--fluid", "fr-mt-4w")}
              style={{
                width: 500,
              }}
            >
              <Input
                label="Adresse email"
                state={errors.email?.message ? "error" : "default"}
                stateRelatedMessage={errors.email?.message}
                nativeInputProps={{ ...register("email") }}
              />
              <Button disabled={featureStatus.type === "loading" || !isValid}>Envoyer</Button>
            </div>
          </form>
        </>
      )}
    </>
  );
};
