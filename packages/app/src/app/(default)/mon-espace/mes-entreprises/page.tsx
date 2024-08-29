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
          Si vous souhaitez supprimer une adresse email rattachée à un siren, veuillez{" "}
          <Link target="_blank" href={"mailto:contact@moncomptepro.beta.gouv.fr"}>
            contacter MonComptePro
          </Link>{" "}
          pour envoyer votre demande. Il faut{" "}
          <Link
            target="_blank"
            href={`https://app${
              config.api.security.moncomptepro.appTest ? "-sandbox" : ""
            }.moncomptepro.beta.gouv.fr/users/start-sign-in`}
          >
            créer un nouveau compte MonComptePro
          </Link>{" "}
          pour rattacher une autre adresse email à un numéro Siren.
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
              <a
                target="_blank"
                href={`https://app${
                  config.api.security.moncomptepro.appTest ? "-sandbox" : ""
                }.moncomptepro.beta.gouv.fr/users/start-sign-in`}
              >
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
            <p>
              <br />
              Vous souhaitez rattacher votre adresse email à une autre entreprise,{" "}
              <Link
                target="_blank"
                href={`https://app${
                  config.api.security.moncomptepro.appTest ? "-sandbox" : ""
                }.moncomptepro.beta.gouv.fr/manage-organizations`}
              >
                cliquez ici
              </Link>
            </p>
          </Box>
          {typeof selectedSiren === "string" && (
            <Box mt="4w">
              <Heading as="h1" variant="h6" text="Responsables" />
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
              <p>
                <br />
                Vous souhaitez rattacher votre adresse email à une autre entreprise,{" "}
                <Link
                  target="_blank"
                  href={`https://app${
                    config.api.security.moncomptepro.appTest ? "-sandbox" : ""
                  }.moncomptepro.beta.gouv.fr/manage-organizations`}
                >
                  cliquez ici
                </Link>
              </p>
            </Box>
            <Box mt="4w">Le siren fournit est invalide.</Box>
          </Box>
        </MessageProvider>
      );
    return null;
  }
};

export default MesEntreprisesPage;
