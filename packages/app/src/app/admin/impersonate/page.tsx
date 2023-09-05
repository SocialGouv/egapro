import { authConfig } from "@api/core-domain/infra/auth/config";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { CenteredContainer } from "@design-system";
import { getServerSession } from "next-auth";

import { ImpersonateForm } from "./Form";

const ImpersonatePage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;

  return (
    <CenteredContainer py="4w">
      <h1>Mimoquer un SIREN</h1>
      <p>
        En tant qu'administrateur, vous pouvez vous "mimoquer" en tant que référent d'une entreprise en saisissant son
        SIREN. Vous pourrez alors accéder à son tableau de bord, ses déclarations, etc.
      </p>
      {session.staff?.impersonating && (
        <Alert
          className="fr-mb-2w"
          title="Vous êtes en train de mimoquer une entreprise"
          severity="info"
          description={`Vous êtes actuellement sous l'identité d'une entreprise. Pour revenir à votre
          compte staff normal, cliquez sur le bouton "Arrêter de mimoquer.`}
        />
      )}
      <ImpersonateForm />
    </CenteredContainer>
  );
};

export default ImpersonatePage;
