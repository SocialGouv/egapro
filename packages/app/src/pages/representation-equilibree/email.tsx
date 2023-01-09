import { normalizeRouterQuery } from "@common/utils/url";
import { ClientOnly } from "@components/ClientOnly";
import { AlertFeatureStatus, FeatureStatusProvider, useFeatureStatus } from "@components/FeatureStatusProvider";
import { RepresentationEquilibreeStartLayout } from "@components/layouts/RepresentationEquilibreeStartLayout";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { requestEmailForToken, useUser } from "@services/apiClient";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";

const title = "Validation de l'email";

const formSchema = z.object({
  email: z.string().min(1, "L'adresse email est requise.").email({ message: "L'adresse email est invalide." }),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const informationMessage =
  "En cas d'email erroné, vous ne pourrez pas remplir le formulaire ou accéder à votre déclaration déjà transmise.";

const EmailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { featureStatus, setFeatureStatus } = useFeatureStatus();
  const defaultRedirectTo = "/representation-equilibree/commencer";
  const { redirectTo } = normalizeRouterQuery(router.query);

  if (user) router.push(redirectTo || defaultRedirectTo);

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
      <h1>{title}</h1>

      <ClientOnly>
        {featureStatus.type !== "success" && (
          <Alert type="info" mb="4w">
            <AlertTitle>Information</AlertTitle>
            <p>{informationMessage}</p>
          </Alert>
        )}

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
            <FormButton type="button" onClick={() => setFeatureStatus({ type: "idle" })}>
              Réessayer
            </FormButton>
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
                  <FormInput
                    aria-describedby={errors.email && "email-msg"}
                    id="email"
                    type="email"
                    {...register("email")}
                  />
                  {errors.email?.message && <FormGroupMessage id="email-msg">{errors.email.message}</FormGroupMessage>}
                </FormGroup>
                <FormLayoutButtonGroup>
                  <FormButton isDisabled={featureStatus.type === "loading" || !isDirty || (isSubmitted && !isValid)}>
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
  return (
    <RepresentationEquilibreeStartLayout>
      <FeatureStatusProvider>{children}</FeatureStatusProvider>
    </RepresentationEquilibreeStartLayout>
  );
};

export default EmailPage;
