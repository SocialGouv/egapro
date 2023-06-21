import { authConfig, monCompteProProvider } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { SirenYearForm } from "./SirenYearForm";

const title = "Commencer";

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

  console.log("session.user.tokenApiV1:", session.user.tokenApiV1);

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
            Une fois la demande validée par MonComptePro, vous pourrez continuer votre déclaration.
          </>
        }
      />
    );
  }

  return (
    <>
      <Stepper currentStep={1} nextTitle="Informations de l'entreprise / UES" stepCount={3} title={title} />

      <Alert
        severity="info"
        small={true}
        description={
          <>
            Si vous déclarez votre index en tant qu'unité économique et sociale (UES), vous devez effectuer une seule
            déclaration et l'entreprise déclarant pour le compte de l'UES doit être celle ayant effectué la déclaration
            les années précédentes. Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez
            saisir les informations correspondantes à la déclaration.
          </>
        }
        className={fr.cx("fr-mb-4w")}
      />
      <SirenYearForm />
    </>
  );
};

export default CommencerPage;
