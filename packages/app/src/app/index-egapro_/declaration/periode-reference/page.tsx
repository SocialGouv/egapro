import { type FunnelKey } from "../../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { PeriodeReferenceForm } from "./PeriodeReferenceForm";

const stepName: FunnelKey = "periode-reference";

const InformationsEntreprisePage = () => {
  return (
    <>
      {/* <Stepper
        currentStep={3}
        nextTitle="Écart de rémunération entre les femmes et les hommes"
        stepCount={nbSteps}
        title={title}
      /> */}

      <DeclarationStepper stepName={stepName} />

      <PeriodeReferenceForm />
    </>
  );
};

export default InformationsEntreprisePage;
