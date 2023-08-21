import { authConfig } from "@api/core-domain/infra/auth/config";
import { getServerSession } from "next-auth";

import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { DeclarantForm } from "./DeclarantForm";

const stepName: FunnelKey = "declarant";

const DeclarantPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;

  return (
    <>
      <DeclarationStepper stepName={stepName} />

      <DeclarantForm session={session} />
    </>
  );
};

export default DeclarantPage;
