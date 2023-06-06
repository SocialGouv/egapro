import { Stepper } from "@codegouvfr/react-dsfr/Stepper";

import { PeriodeReferenceForm } from "./PeriodeReferenceForm";

const title = "Informations calcul et période de référence";

const InformationsEntreprisePage = () => {
  return (
    <>
      <Stepper
        currentStep={2}
        nextTitle="Écart de rémunération entre les femmes et les hommes"
        stepCount={3}
        title={title}
      />

      <PeriodeReferenceForm />
    </>
  );
};

export default InformationsEntreprisePage;
