import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { DeclarantForm } from "./DeclarantForm";

const stepName: FunnelKey = "declarant";

const DeclarantPage = () => {
  return (
    <>
      <DeclarationStepper stepName={stepName} />

      <DeclarantForm />
    </>
  );
};

export default DeclarantPage;
