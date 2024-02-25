import { authConfig } from "@api/core-domain/infra/auth/config";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AddDeclarer } from "./AddDeclarer";

const title = "Connexion";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const RattachementPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");

  return (
    <>
      <AddDeclarer email={session.user.email} />
    </>
  );
};

export default RattachementPage;
