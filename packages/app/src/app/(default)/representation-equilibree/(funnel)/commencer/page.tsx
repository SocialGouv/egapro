import { authConfig, monCompteProProvider } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { CommencerForm } from "./Form";

const title = "Commencer";

export const metadata = {
  title,
  openGraph: {
    title,
  },
  robots: "noindex, nofollow",
};

const CommencerPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;
  const monCompteProHost = monCompteProProvider.issuer;

  if (!session.user.companies.length) {
    return (
      <Alert
        severity="warning"
        className={fr.cx("fr-mb-4w")}
        title="Aucune entreprise rattachée"
        description={
          <>
            Nous n'avons trouvé aucune entreprise à laquelle votre compte ({session.user.email}) est rattaché. Si vous
            pensez qu'il s'agit d'une erreur, vous pouvez faire une demande de rattachement directement depuis{" "}
            <Link href={`${monCompteProHost}/manage-organizations`} target="_blank">
              votre espace MonComptePro
            </Link>
            .<br />
            Une fois la demande validée par MonComptePro, vous pourez continuer votre déclaration.
          </>
        }
      />
    );
  }

  return (
    <>
      <p>
        <b>
          Si vous souhaitez visualiser ou modifier une déclaration déjà transmise, veuillez saisir les informations
          correspondantes à la déclaration.
        </b>
      </p>
      <CommencerForm session={session} />
    </>
  );
};

export default CommencerPage;
