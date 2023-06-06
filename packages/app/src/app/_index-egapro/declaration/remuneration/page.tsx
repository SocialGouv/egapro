import { Stepper } from "@codegouvfr/react-dsfr/Stepper";

import { RemunerationForm } from "./RemunerationForm";

const title = "Écart de rémunération entre les femmes et les hommes";

const RemunerationPage = () => {
  return (
    <>
      <Stepper
        currentStep={2}
        nextTitle="Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique"
        stepCount={3}
        title={title}
      />

      <RemunerationForm />
    </>
  );
};

export default RemunerationPage;
