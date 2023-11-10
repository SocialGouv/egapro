import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { UESForm } from "./UESForm";

const stepName: FunnelKey = "ues";

const InformationsUESPage = () => {
  return (
    <>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <UESForm />
    </>
  );
};

export default InformationsUESPage;
