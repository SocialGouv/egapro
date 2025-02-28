import { authConfig } from "@api/core-domain/infra/auth/config";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Heading, Link } from "@design-system";
import { MessageProvider } from "@design-system/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getAllEmailsBySiren } from "../actions";
import { AddOwnershipForm } from "../AddOwnershipForm";
import { EmailOwnerList } from "../EmailOwnerList";
import { SelectSiren } from "./SelectSiren";

const proconnectSignInUrl = process.env.EGAPRO_PROCONNECT_SIGN_IN_URL;
const proconnectManageOrganisationsUrl = process.env.EGAPRO_PROCONNECT_MANAGE_ORGANISATIONS_URL;

const MesEntreprisesInfoAlert = () => (
  <Alert
    severity="info"
    small
    description={
      <>
        <p>
          Dans ce menu, vous pouvez consulter les adresses emails qui ont été rattachées à votre entreprise, en
          sélectionnant au préalable dans la liste déroulante le numéro Siren de l'entreprise si vous gérez plusieurs
          entreprises.
        </p>
        <br />
        <p>
          Pour rattacher une adresse email, il faut{" "}
          <Link target="_blank" href={`${proconnectSignInUrl}`}>
            créer un nouveau compte ProConnect
          </Link>{" "}
          avec cette adresse.
        </p>
        <p>
          <br />
          Vous souhaitez rattacher votre adresse email à une autre entreprise,{" "}
          <Link target="_blank" href={`${proconnectManageOrganisationsUrl}`}>
            cliquez ici
          </Link>
        </p>
      </>
    }
  />
);

const MesEntreprisesPage = async ({ searchParams }: NextServerPageProps<never, "siren">) => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");
  const sirenList = (session?.user.companies || []).map(company => company.siren);
  const isEmailLogin = config.api.security.auth.isEmailLogin;

  if (!sirenList.length)
    return (
      <MessageProvider>
        <Box mb="10w">
          <Heading as="h1" text="Mes entreprises" />

          {isEmailLogin ? (
            <Box mt="4w">
              Vous n'avez pas encore d'entreprises rattachés.
              <br />
              <a href="/rattachement">Aller sur la page de demande de rattachement</a> et ajoutez votre entreprise.
            </Box>
          ) : (
            <Box mt="4w">
              <MesEntreprisesInfoAlert />
              Vous n'avez pas encore d'entreprises rattachés.
              <br />
              <a target="_blank" href={`${proconnectSignInUrl}`}>
                Connectez-vous sur Mon Compte Pro
              </a>{" "}
              et ajoutez votre entreprise.
            </Box>
          )}
        </Box>
      </MessageProvider>
    );
  const selectedSiren = typeof searchParams.siren === "string" ? searchParams.siren : sirenList[0];

  try {
    const emails = await getAllEmailsBySiren(selectedSiren);

    return (
      <MessageProvider>
        <Box mb="10w">
          <Heading as="h1" text="Mes entreprises" />
          <MesEntreprisesInfoAlert />
          <Box mt="2w">
            <SelectSiren sirenList={sirenList} loadedSiren={selectedSiren} />
          </Box>
          {typeof selectedSiren === "string" && (
            <Box mt="4w">
              <Heading as="h1" variant="h6" text="Adresses emails rattachées" />
              <EmailOwnerList isEmailLogin={isEmailLogin} siren={selectedSiren} emails={emails} />
              {isEmailLogin && <AddOwnershipForm siren={selectedSiren} />}
            </Box>
          )}
        </Box>
      </MessageProvider>
    );
  } catch (error: unknown) {
    if (error && error.constructor.name === "UnexpectedSessionError")
      return (
        <MessageProvider>
          <Box mb="10w">
            <Heading as="h1" text="Mes entreprises" />
            <MesEntreprisesInfoAlert />
            <Box mt="2w">
              <SelectSiren sirenList={sirenList} />
            </Box>
            <Box mt="4w">Le siren fournit est invalide.</Box>
          </Box>
        </MessageProvider>
      );
    return null;
  }
};

export default MesEntreprisesPage;
