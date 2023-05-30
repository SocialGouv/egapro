import { authConfig } from "@api/core-domain/infra/auth/config";
import { getServerSession } from "next-auth";

import { CommencerForm } from "./Form";

const title = "Commencer";

export const metadata = {
  title,
  openGraph: {
    title,
  },
  robots: "noindex, nofollow",
};

const CommencerPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;

  return (
    <>
      <p>
        <b>
          Si vous souhaitez visualiser ou modifier une déclaration déjà transmise, veuillez saisir les informations
          correspondantes à la déclaration.
        </b>
      </p>
      <CommencerForm session={session} />
    </>
  );
};

export default CommencerPage;
