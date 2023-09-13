import { CenteredContainer } from "@design-system";

import { ImpersonateForm } from "./Form";

const ImpersonatePage = async () => {
  return (
    <CenteredContainer py="4w">
      <h1>Mimoquer un Siren</h1>
      <p>
        En tant qu'administrateur, vous pouvez vous "mimoquer" en tant que référent d'une entreprise en saisissant son
        Siren. Vous pourrez alors accéder à son tableau de bord, ses déclarations, etc.
      </p>
      <ImpersonateForm />
    </CenteredContainer>
  );
};

export default ImpersonatePage;
