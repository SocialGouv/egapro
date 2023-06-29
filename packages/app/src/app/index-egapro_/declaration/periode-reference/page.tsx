import { type FunnelKey } from "../../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { PeriodeReferenceForm } from "./PeriodeReferenceForm";

const stepName: FunnelKey = "periode-reference";

const InformationsEntreprisePage = () => {
  return (
    <>
      <DeclarationStepper stepName={stepName} />

      <PeriodeReferenceForm />
    </>
  );
};

export default InformationsEntreprisePage;
