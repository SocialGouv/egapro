import { Stepper } from "@codegouvfr/react-dsfr/Stepper";

import { nbSteps } from "../../constants";
import { RemunerationForm } from "./RemunerationForm";

const title = "Écart de rémunération entre les femmes et les hommes";

const RemunerationPage = () => {
  return (
    <>
      <Stepper
        currentStep={4}
        nextTitle="Écart de rémunération entre les femmes et les hommes par niveau ou coefficient hiérarchique"
        stepCount={nbSteps}
        title={title}
      />

      <RemunerationForm />
    </>
  );
};

export default RemunerationPage;
