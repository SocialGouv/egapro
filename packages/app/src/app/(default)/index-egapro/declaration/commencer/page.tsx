import { authConfig, monCompteProProvider } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { type FunnelKey, funnelStaticConfig } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { CommencerForm } from "./CommencerForm";

const stepName: FunnelKey = "commencer";

const title = funnelStaticConfig[stepName].title;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const CommencerPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;

  const monCompteProHost = monCompteProProvider.issuer;

  if (!session.user.companies.length && !session.user.staff) {
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
            Une fois la demande validée par MonComptePro, vous pourrez continuer votre déclaration.
          </>
        }
      />
    );
  }

  return (
    <>
      <DeclarationStepper stepName={stepName} />

      <Alert
        severity="info"
        small={true}
        description={
          <>
            Si vous déclarez votre index en tant qu'unité économique et sociale (UES), vous devez effectuer une seule
            déclaration et l'entreprise déclarant pour le compte de l'UES doit être celle ayant effectué la déclaration
            les années précédentes.
            <span className="fr-mb-1w block" />
            Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez saisir les informations
            correspondantes à la déclaration.
          </>
        }
        className={fr.cx("fr-mb-4w")}
      />
      <CommencerForm />
    </>
  );
};

export default CommencerPage;
