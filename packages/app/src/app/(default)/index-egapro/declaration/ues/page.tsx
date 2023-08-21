import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { UESForm } from "./UESForm";

const stepName: FunnelKey = "ues";

const InformationsUESPage = () => {
  return (
    <>
      <DeclarationStepper stepName={stepName} />

      <UESForm />
    </>
  );
};

export default InformationsUESPage;
