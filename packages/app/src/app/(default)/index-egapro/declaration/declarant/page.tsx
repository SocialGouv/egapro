import { authConfig } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { DeclarantForm } from "./DeclarantForm";

const stepName: FunnelKey = "declarant";

const DeclarantPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;
  const monCompteProUrl = `https://identite${
    config.api.security.moncomptepro.appTest ? "-sandbox" : ""
  }.proconnect.gouv.fr`;

  return (
    <>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

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
            <Link href={`${monCompteProUrl}/personal-information`} target="_blank">
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
