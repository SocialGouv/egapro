import { authConfig } from "@api/core-domain/infra/auth/config";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import { OtherCompaniesNotice } from "@components/OtherCompaniesNotice";
import Link from "next/link";
import { redirect } from "next/navigation";
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

const proconnectManageOrganisationsUrl = config.proconnect.manageOrganisationUrl;

const CommencerPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");
  const isEmailLogin = config.api.security.auth.isEmailLogin;

  if (!session.user.companies.length && !session.user.staff) {
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
      <DeclarationStepper stepName={stepName} />

      <Alert
        severity="info"
        small={true}
        description={
          <>
            <p className={fr.cx("fr-mb-2w")}>
              Pour une <strong>déclaration au titre d'une unité économique et sociale (UES)</strong>, vous devez
              transmettre une seule déclaration. L'entreprise qui réalise la démarche doit être la même que les années
              précédentes afin de garantir le suivi de votre historique, sauf si celle-ci a fermé ou a quitté l'UES.
            </p>
            <OtherCompaniesNotice />
          </>
        }
        className={fr.cx("fr-mb-4w")}
      />
      <CommencerForm />
    </>
  );
};

export default CommencerPage;
