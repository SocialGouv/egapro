import { authConfig } from "@api/core-domain/infra/auth/config";
import { getServerSession } from "next-auth";

import { LoginRedirect } from "./LoginRedirect";

const Redirect = async () => {
  const session = await getServerSession(authConfig);
  return <LoginRedirect session={session} />;
};

export default Redirect;
