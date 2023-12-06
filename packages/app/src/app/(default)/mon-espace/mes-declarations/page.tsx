import { MessageProvider } from "@design-system/client";
import { type Session } from "next-auth";

import { IndexList } from "./IndexList";

const canEditSiren = (user?: Session["user"]) => (siren?: string) => {
  if (!siren || !user) return undefined;
  return user.staff || user.companies.some(company => company.siren === siren);
};

const MesDeclarationsPage = async () => {
  return (
    <MessageProvider>
      <IndexList />
      {/* <RepeqList /> */}
    </MessageProvider>
  );
};

export default MesDeclarationsPage;
