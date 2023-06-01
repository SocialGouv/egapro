import { authConfig, monCompteProProvider } from "@api/core-domain/infra/auth/config";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, CenteredContainer } from "@design-system";
import Link from "next/link";
import { getServerSession } from "next-auth";

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

const LoginPage = async ({ searchParams }: NextServerPageProps<never, "callbackUrl" | "error">) => {
  const session = await getServerSession(authConfig);
  const monCompteProHost = monCompteProProvider.issuer;

  const callbackUrl = typeof searchParams.callbackUrl === "string" ? searchParams.callbackUrl : "";
  const error = typeof searchParams.error === "string" ? searchParams.error : "";

  return (
    <CenteredContainer>
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
          <Alert
            severity="info"
            title="Identification unique"
            description={
              <>
                Afin de simplifier et sécuriser votre parcours, Egapro utilise le service d'identification MonComptePro
                afin de garantir l'appartenance de ses utilisateurs aux entreprises déclarantes.
                <br />
                <br />
                Le compte utilisé doit correspondre à celui de la personne à contacter par les services de l'inspection
                du travail en case de besoin. L'email associé sera celui sur lequel sera adressé l'accusé de réception
                en fin de déclaration.
                <br />
                <br />
                Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez vous assurez que
                votre compte est{" "}
                <Link href={`${monCompteProHost}/manage-organizations`} target="_blank">
                  rattaché à votre entreprise
                </Link>
                .
              </>
            }
          />
          <Box style={{ textAlign: "center" }} mt="2w">
            <MonCompteProLogin callbackUrl={callbackUrl} />
          </Box>
        </>
      )}
    </CenteredContainer>
  );
};

export default LoginPage;
