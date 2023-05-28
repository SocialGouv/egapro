import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import { type NextServerPageProps } from "@common/utils/next";

import { CheckLogged } from "./CheckLogged";
import { EmailLogin } from "./EmailLogin";
import { MonCompteProLogin } from "./MonCompteProLogin";

const title = "Connexion";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const signinErrors: Record<string, string> = {
  Signin: "Essayez de vous connecter avec un compte différent.",
  OAuthSignin: "Essayez de vous connecter avec un compte différent.",
  OAuthCallback: "Essayez de vous connecter avec un compte différent.",
  OAuthCreateAccount: "Essayez de vous connecter avec un compte différent.",
  EmailCreateAccount: "Essayez de vous connecter avec un compte différent.",
  Callback: "Essayez de vous connecter avec un compte différent.",
  OAuthAccountNotLinked:
    "Pour confirmer votre identité, connectez-vous avec le même compte que vous avez utilisé à l'origine.",
  EmailSignin: "L'email n'a pas pu être envoyé.",
  CredentialsSignin: "Connexion échouée. Veuillez vérifier vos identifiants.",
  SessionRequired: "Merci de vous connecter pour accéder à cette page.",
  default: "Impossible de se connecter.",
};

const mailDevUrl = config.host.startsWith("http://localhost")
  ? "http://localhost:1080/"
  : config.host.replace("https://", "https://maildev-");

const LoginPage = async ({ searchParams }: NextServerPageProps<never, "callbackUrl" | "error">) => {
  const callbackUrl = typeof searchParams.callbackUrl === "string" ? searchParams.callbackUrl : "";
  const error = typeof searchParams.error === "string" ? searchParams.error : "";

  return (
    <>
      <h1>{title}</h1>
      <CheckLogged>
        {error && (
          <>
            <Alert
              title="Erreur de connexion"
              description={signinErrors[error] || signinErrors.default}
              severity="error"
            />
            <br />
          </>
        )}

        <EmailLogin callbackUrl={callbackUrl} />
        {config.env !== "prod" && (
          <a href={mailDevUrl} target="_blank">
            Debug: Ouvrir MailDev
          </a>
        )}
        {config.ff.moncomptepro && (
          <>
            <hr className={fr.cx("fr-mt-4w")} />
            <MonCompteProLogin callbackUrl={callbackUrl} />
          </>
        )}
      </CheckLogged>
    </>
  );
};

export default LoginPage;
