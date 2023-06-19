import { authBaseConfig } from "@api/core-domain/infra/auth/config";
import { config } from "@common/config";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { cloneDeep } from "lodash";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

export const revalidate = 0;

const DebugPage = async () => {
  const session = await getServerSession(authBaseConfig);

  if (!(process.env.NODE_ENV === "development" || session?.user.staff)) {
    notFound();
  }

  const clone = cloneDeep(config);
  return (
    <>
      <h1>Server Side Config</h1>
      <DebugButton alwaysOn obj={clone} infoText="server side config" />
      <pre>{JSON.stringify(clone, null, 2)}</pre>
    </>
  );
};

export default DebugPage;
