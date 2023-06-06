import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";

import { SirenYearForm } from "./SirenYearForm";

const CommencerPage = () => {
  return (
    <>
      <Stepper currentStep={1} nextTitle="Informations de l'entreprise / UES" stepCount={3} title="Commencer" />

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
