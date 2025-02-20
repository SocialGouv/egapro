import { referentRepo } from "@api/core-domain/repo";
import { GetReferents } from "@api/core-domain/useCases/referent/GetReferents";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Container } from "@design-system";

import { ActionButtons } from "./_actionButtons/ActionButtons";
import { EditReferentModal } from "./EditReferentModal";
import { ReferentList } from "./ReferentList";

const title = "Liste référents";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

export const dynamic = "force-dynamic";

const ReferentListPage = async () => {
  const useCase = new GetReferents(referentRepo);
  const referents = await useCase.execute();

  return (
    <>
      <EditReferentModal />
      <Container as="section" py="4w">
        <h1>Liste des référents Egapro</h1>
        <ActionButtons />
        {referents.length ? (
          <ReferentList referents={referents} />
        ) : (
          <Alert severity="info" small description="Aucun référent Egapro enregistré." />
        )}
      </Container>
    </>
  );
};

export default ReferentListPage;
