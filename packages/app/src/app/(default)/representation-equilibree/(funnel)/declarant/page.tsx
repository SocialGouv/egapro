import { authConfig } from "@api/core-domain/infra/auth/config";
import { getServerSession } from "next-auth";

import { DeclarantForm } from "./Form";

const title = "Informations déclarant";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const DeclarantPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return null;

  return (
    <>
      {/* <AlertEdition /> */}
      <p>
        <b>
          Renseignez le nom, le prénom et le numéro de téléphone du déclarant pour tout contact ultérieur par les
          services de l’inspection du travail.
        </b>
        <br />
        Les informations sont préremplies grâce à votre compte MonComptePro mais vous pouvez choisir de modifier les
        informations déclarant au besoin. En revanche, l'email de référence ne peut être modifiée.
      </p>

      <DeclarantForm session={session} />
    </>
  );
};

export default DeclarantPage;
