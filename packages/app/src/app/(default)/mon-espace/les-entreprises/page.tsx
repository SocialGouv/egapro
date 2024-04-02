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

const MesEntreprisesInfoAlert = () => (
  <Alert
    severity="info"
    small
    description={
      <>
        <p>
          Dans ce menu, vous pouvez consulter les adresses mails rattachées à une entreprise en sélectionnant au
          préalable dans la liste déroulante le numéro Siren de l'entreprise concernée si vous gérez plusieurs
          entreprises.
        </p>
        <p>
          {" "}
          Si vous souhaitez supprimer une adresse mail rattachée à un siren, veuillez{" "}
          <Link target="_blank" href={"mailto:contact@moncomptepro.beta.gouv.fr"}>
            contacter MonComptePro
          </Link>{" "}
          pour envoyer votre demande. Il faut{" "}
          <Link
            target="_blank"
            href={`https://app${
              config.api.security.moncomptepro.appTest ? "-test" : ""
            }.moncomptepro.beta.gouv.fr/users/start-sign-in`}
          >
            créer un nouveau compte MonComptePro
          </Link>{" "}
          pour rattacher une autre adresse mail à un numéro Siren.
        </p>
      </>
    }
  />
);

const MesEntreprisesPage = async ({ searchParams }: NextServerPageProps<never, "siren">) => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");
  if (!session.user.staff) redirect("/mon-espace/mon-profil");
  const isEmailLogin = config.api.security.auth.isEmailLogin;

  if (typeof searchParams.siren !== "string")
    return (
      <MessageProvider>
        <Box mb="10w">
          <Heading as="h1" text="Les entreprises" />
          <MesEntreprisesInfoAlert />
          <Box mt="2w">
            <SirenInput />
          </Box>
          <p>
            <br />
            Vous souhaitez rattacher votre adresse mail à un autre Siren,{" "}
            <Link href="https://app.moncomptepro.beta.gouv.fr/manage-organizations">cliquez ici</Link>
          </p>
        </Box>
      </MessageProvider>
    );

  const selectedSiren = searchParams.siren;

  try {
    const emails = await getAllEmailsBySiren(selectedSiren);

    return (
      <MessageProvider>
        <Box mb="10w">
          <Heading as="h1" text="Les entreprises" />
          <MesEntreprisesInfoAlert />
          <Box mt="2w">
            <SirenInput loadedSiren={selectedSiren} />
          </Box>
          <p>
            <br />
            Vous souhaitez rattacher votre adresse mail à un autre Siren,{" "}
            <Link href="https://app.moncomptepro.beta.gouv.fr/manage-organizations">cliquez ici</Link>
          </p>
          <Box mt="4w">
            <Heading as="h1" variant="h6" text="Responsables" />
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
            <p>
              <br />
              Vous souhaitez rattacher votre adresse mail à un autre Siren,{" "}
              <Link href="https://app.moncomptepro.beta.gouv.fr/manage-organizations">cliquez ici</Link>
            </p>
            <Box mt="4w">Pas d'utilisateur pour ce Siren ou Url invalide</Box>
          </Box>
        </MessageProvider>
      );
    return null;
  }
};

export default MesEntreprisesPage;
