import { authConfig } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { TITLES } from "../titles";
import { CommencerForm } from "./Form";

const title = TITLES.commencer;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const proconnectManageOrganisationsUrl = config.proconnect.manageOrganisationUrl;

const CommencerPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;
  const isEmailLogin = config.api.security.auth.isEmailLogin;

  if (!(session.user.companies.length || session.user.staff)) {
    return isEmailLogin ? (
      <Alert
        severity="warning"
        className={fr.cx("fr-mb-4w")}
        title="Aucune entreprise rattachée"
        description={
          <>
            Nous n'avons trouvé aucune entreprise à laquelle votre compte ({session.user.email}) est rattaché. Si vous
            pensez qu'il s'agit d'une erreur, vous pouvez faire une demande de rattachement directement depuis{" "}
            <Link href="/rattachement">la page de demande de rattachement</Link>
            .<br />
            Une fois la demande validée, vous pourrez continuer votre déclaration.
          </>
        }
      />
    ) : (
      <Alert
        severity="warning"
        className={fr.cx("fr-mb-4w")}
        title="Aucune entreprise rattachée"
        description={
          <>
            Nous n'avons trouvé aucune entreprise à laquelle votre compte ({session.user.email}) est rattaché. Si vous
            pensez qu'il s'agit d'une erreur, vous pouvez faire une demande de rattachement directement depuis{" "}
            <Link href={`${proconnectManageOrganisationsUrl}`} target="_blank">
              votre espace ProConnect
            </Link>
            .<br />
            Une fois la demande validée par ProConnect, vous pourrez continuer votre déclaration.
          </>
        }
      />
    );
  }

  return (
    <>
      <Alert
        severity="info"
        small
        className={fr.cx("fr-mb-3w")}
        description="Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez saisir les informations
          correspondantes à la déclaration."
      />
      <CommencerForm session={session} monCompteProHost={proconnectManageOrganisationsUrl ?? ""} />
    </>
  );
};

export default CommencerPage;
