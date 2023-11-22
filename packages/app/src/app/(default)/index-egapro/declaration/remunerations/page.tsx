import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { RemunerationForm } from "./RemunerationForm";

const stepName: FunnelKey = "remunerations";

const RemunerationPage = () => {
  return (
    <>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <RemunerationForm />
    </>
  );
};

export default RemunerationPage;
