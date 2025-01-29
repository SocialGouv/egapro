import { authConfig } from "@api/core-domain/infra/auth/config";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, CenteredContainer, Link } from "@design-system";
import { getServerSession } from "next-auth";

import { EmailLogin } from "./EmailLogin";
import { GithubLogin } from "./GithubLogin";
import { ProConnectLogin } from "./ProConnectLogin";

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
  AccessDenied: "Vous n'êtes pas staff.",
  default: "Impossible de se connecter.",
};

const LoginPage = async ({ searchParams }: NextServerPageProps<never, "callbackUrl" | "error">) => {
  const session = await getServerSession(authConfig);
  const callbackUrl = typeof searchParams.callbackUrl === "string" ? searchParams.callbackUrl : "";
  const error = typeof searchParams.error === "string" ? searchParams.error : "";
  const isEmailLogin = config.api.security.auth.isEmailLogin;

  return (
    <CenteredContainer py="6w">
      <h1>{title}</h1>
      {session?.user ? (
        <Alert severity="success" title={session?.user.email} description="Vous êtes déjà connecté·e." />
      ) : (
        <>
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
          {!isEmailLogin && (
            <Alert
              severity="info"
              small
              description={
                <>
                  <p>
                    Egapro utilise le service d’identification ProConnect (anciennement MonComptePro) afin de garantir
                    l’appartenance de ses utilisateurs aux entreprises déclarantes.
                  </p>
                  <br />
                  <p>
                    Pour s'identifier avec ProConnect, il convient d'utiliser une <b>adresse email professionnelle</b>,
                    celle-ci doit correspondre à la personne à contacter par les services de l'inspection du travail en
                    cas de besoin.
                  </p>
                  <br />
                  <p>
                    <strong>
                      Les tiers déclarants (comptables...) ne sont pas autorisés à déclarer pour le compte de leur
                      entreprise cliente. Cette dernière doit créer son propre compte ProConnect pour déclarer sur
                      Egapro.
                    </strong>
                  </p>
                  <br />
                  <p className={"text-dsfr-error"}>
                    Si vous utilisez une protection contre les spams (ex. MailInBlack), vous devez contacter votre
                    service informatique pour qu'il autorise les mails en provenance de ProConnect.
                  </p>
                  <br />
                  <p className={"text-dsfr-error"}>
                    Pour tout problème lié à ProConnect, vous devez contacter le support dédié via le centre d'aide{" "}
                    <Link href="https://agentconnect.crisp.help/fr/" target={"_blank"}>
                      https://agentconnect.crisp.help/fr/
                    </Link>
                  </p>
                  <br />
                  <p>
                    Pour consulter l'aide,{" "}
                    <Link href={"/aide-proconnect"} target={"_blank"}>
                      cliquez ici
                    </Link>
                  </p>
                </>
              }
            />
          )}
          <Box className="text-center" mt="2w">
            {isEmailLogin ? (
              <EmailLogin callbackUrl={callbackUrl} />
            ) : (
              <>
                <ProConnectLogin callbackUrl={callbackUrl} />
              </>
            )}
            <GithubLogin callbackUrl={callbackUrl} />
          </Box>
        </>
      )}
    </CenteredContainer>
  );
};

export default LoginPage;
