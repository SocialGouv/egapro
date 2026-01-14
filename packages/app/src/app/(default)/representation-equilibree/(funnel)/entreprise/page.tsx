import { getServerSession } from "next-auth";
import { TITLES } from "../titles";
import { EntrepriseForm } from "./Form";
import { authConfig } from "@api/core-domain/infra/auth/config";

const title = TITLES.entreprise;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const InformationsEntreprise = async () => {
  const session = await getServerSession(authConfig);
  if (!session) {
    return <></>
  }
  return (
    <>
      <EntrepriseForm session={session} />
    </>
  );
};

export default InformationsEntreprise;
