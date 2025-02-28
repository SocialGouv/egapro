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
import { SirenInput } from "./SirenInput";

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
  const isImpersonating = session?.staff.impersonating;
  if (!session) redirect("/login");
  if (!session.user.staff && !isImpersonating) redirect("/mon-espace/mon-profil");
  const isEmailLogin = config.api.security.auth.isEmailLogin;

  if (typeof searchParams.siren !== "string" && !isImpersonating)
    return (
      <MessageProvider>
        <Box mb="10w">
          <Heading as="h1" text="Les entreprises" />
          <MesEntreprisesInfoAlert />
          <Box mt="2w">
            <SirenInput />
          </Box>
        </Box>
      </MessageProvider>
    );

  const selectedSiren = isImpersonating ? session.user.companies[0].siren : (searchParams.siren as string);

  try {
    const emails = await getAllEmailsBySiren(selectedSiren);
    return (
      <MessageProvider>
        <Box mb="10w">
          <Heading as="h1" text="Les entreprises" />
          <MesEntreprisesInfoAlert />
          <Box mt="2w">
            <SirenInput isImpersonating={isImpersonating} loadedSiren={selectedSiren} />
          </Box>
          <Box mt="4w">
            <Heading as="h1" variant="h6" text="Adresses emails rattachées" />
            <EmailOwnerList isEmailLogin={isEmailLogin} siren={selectedSiren} emails={emails} />
            {isEmailLogin && <AddOwnershipForm siren={selectedSiren} />}
          </Box>
        </Box>
      </MessageProvider>
    );
  } catch (error: unknown) {
    if (error && error.constructor.name === "UnexpectedSessionError")
      return (
        <MessageProvider>
          <Box mb="10w">
            <Heading as="h1" text="Les entreprises" />
            <MesEntreprisesInfoAlert />
            <Box mt="2w">
              <SirenInput />
            </Box>
            <Box mt="4w">Pas d'utilisateur pour ce Siren ou Url invalide</Box>
          </Box>
        </MessageProvider>
      );
    return null;
  }
};

export default MesEntreprisesPage;
