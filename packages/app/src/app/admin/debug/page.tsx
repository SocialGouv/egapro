import { authConfig } from "@api/core-domain/infra/auth/config";
import { config } from "@common/config";
import { DebugButton, DebugToggleSwitch } from "@components/utils/debug/DebugButton";
import { CenteredContainer, Heading } from "@design-system";
import { cloneDeep } from "lodash";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

export const revalidate = 0;

const DebugPage = async () => {
  const session = await getServerSession(authConfig);

  if (!(process.env.NODE_ENV === "development" || session?.user.staff)) {
    notFound();
  }

  const clone = cloneDeep(config);
  return (
    <CenteredContainer py="6w">
      <Heading as="h2" variant="h1" text="Admin Debug" />
      <h3>Activer bouton de debug ?</h3>
      <DebugToggleSwitch />
      <hr />
      <h3>Server Side Config</h3>
      <DebugButton alwaysOn obj={clone} infoText="server side config" />
      <pre>{JSON.stringify(clone, null, 2)}</pre>
    </CenteredContainer>
  );
};

export default DebugPage;
