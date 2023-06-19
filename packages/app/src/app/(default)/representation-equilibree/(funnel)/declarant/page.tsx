import { authConfig, monCompteProProvider } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Link } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { getServerSession } from "next-auth";

import { AlertEdition } from "../AlertEdition";
import { DeclarantForm } from "./Form";

const title = "Informations déclarant";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const DeclarantPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;
  const monCompteProHost = monCompteProProvider.issuer;

  return (
    <>
      <ClientAnimate>
        <AlertEdition />
      </ClientAnimate>
      <p>
        <b>
          Renseignez le nom, le prénom et le numéro de téléphone du déclarant pour tout contact ultérieur par les
          services de l’inspection du travail.
        </b>
      </p>
      <Alert
        small
        severity="info"
        className={fr.cx("fr-mb-4w")}
        description={
          <>
            Les informations sont préremplies grâce à votre compte MonComptePro mais vous pouvez choisir de modifier les
            informations déclarant ci-dessous au besoin. En revanche, l'email de référence ne peut être modifiée.
            <br />
            Vous pouvez modifier les informations par défaut sur{" "}
            <Link href={`${monCompteProHost}/personal-information`} target="_blank">
              votre profile MonComptePro
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
