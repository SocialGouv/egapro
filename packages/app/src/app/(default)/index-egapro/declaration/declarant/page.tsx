import { authConfig, monCompteProProvider } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { DeclarantForm } from "./DeclarantForm";

const stepName: FunnelKey = "declarant";

const DeclarantPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;
  const monCompteProHost = monCompteProProvider.issuer;

  return (
    <>
      <DeclarationStepper stepName={stepName} />

      <p>
        Renseignez le nom, le prénom et le numéro de téléphone du déclarant pour tout contact ultérieur par les services
        de l’inspection du travail.
      </p>

      <Alert
        small
        severity="info"
        className={fr.cx("fr-mb-4w")}
        description={
          <>
            Les informations déclarant sont préremplies à partir de votre compte MonComptePro mais vous pouvez les
            modifier le cas échéant, à l'exception de l'email.
            <br />
            Vous pouvez aussi modifier ces informations directement sur{" "}
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
