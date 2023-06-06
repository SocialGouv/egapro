import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";

import { UESForm } from "./UESForm";

const title = "Informations de l’UES";

const InformationsEntreprisePage = () => {
  return (
    <>
      <Stepper currentStep={2} nextTitle="Informations calcul et période de référence" stepCount={3} title={title} />

      <div className={cx("fr-mt-4w")}>
        La raison sociale des entreprises composant l'UES est renseignée automatiquement et n'est pas modifiable (source
        : Répertoire Sirene de l'INSEE).
      </div>

      <UESForm />
    </>
  );
};

export default InformationsEntreprisePage;
