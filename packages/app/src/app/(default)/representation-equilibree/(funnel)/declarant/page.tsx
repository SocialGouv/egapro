import { authConfig } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Link } from "@design-system";
import { getServerSession } from "next-auth";

import { TITLES } from "../titles";
import { DeclarantForm } from "./Form";

const title = TITLES.declarant;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const proconnectDiscoveryUrl = process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;

const DeclarantPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;

  return (
    <>
      <Alert
        small
        severity="info"
        className={fr.cx("fr-mb-4w")}
        description={
          <>
            Les informations déclarant sont préremplies à partir de votre compte ProConnect mais vous pouvez les
            modifier le cas échéant, à l'exception de l'adresse email.
            <br />
            Vous pouvez aussi modifier ces informations directement sur{" "}
            <Link href={`${proconnectDiscoveryUrl}/personal-information`} target="_blank">
              votre profil ProConnect
            </Link>
            .
          </>
        }
      />

      <DeclarantForm session={session} />
    </>
  );
};

export default DeclarantPage;
