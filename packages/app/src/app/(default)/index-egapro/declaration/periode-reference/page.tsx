import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { PeriodeReferenceForm } from "./PeriodeReferenceForm";

const stepName: FunnelKey = "periode-reference";

const InformationsEntreprisePage = () => {
  return (
    <>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <PeriodeReferenceForm />
    </>
  );
};

export default InformationsEntreprisePage;
