import { authConfig } from "@api/core-domain/infra/auth/config";
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
              Vous n'avez pas encore d'entreprises rattachés.
              <br />
              <a
                target="_blank"
                href={`https://app${
                  config.api.security.moncomptepro.appTest ? "-test" : ""
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
          <Box mt="2w">
            <SelectSiren sirenList={sirenList} loadedSiren={selectedSiren} />
            <p>
              <br />
              Vous souhaitez rattacher votre adresse email à un autre Siren,{" "}
              <Link href="https://app.moncomptepro.beta.gouv.fr/manage-organizations">cliquez ici</Link>
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
            <Box mt="2w">
              <SelectSiren sirenList={sirenList} />
              <p>
                <br />
                Vous souhaitez rattacher votre adresse email à un autre Siren,{" "}
                <Link href="https://app.moncomptepro.beta.gouv.fr/manage-organizations">cliquez ici</Link>
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
