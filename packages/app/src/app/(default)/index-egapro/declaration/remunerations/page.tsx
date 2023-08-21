import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { RemunerationForm } from "./RemunerationForm";

const stepName: FunnelKey = "remunerations";

const RemunerationPage = () => {
  return (
    <>
      <DeclarationStepper stepName={stepName} />

      <RemunerationForm />
    </>
  );
};

export default RemunerationPage;
