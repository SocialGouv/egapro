import { authConfig } from "@api/core-domain/infra/auth/config";
import { config } from "@common/config";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Heading } from "@design-system";
import { MessageProvider } from "@design-system/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getAllEmailsBySiren } from "../actions";
import { SelectSiren } from "./SelectSiren";

const MesEntreprisesPage = async ({ searchParams }: NextServerPageProps<never, "siren">) => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");
  const sirenList = (session?.user.companies || []).map(company => company.siren);
  if (!sirenList.length)
    return (
      <MessageProvider>
        <Box mb="10w">
          <Heading as="h1" text="Mes entreprises" />
          <Box mt="4w">
            Vous n'avez pas encore d'entreprises rattachés.
            <br />{" "}
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
          </Box>
          {typeof selectedSiren === "string" && (
            <Box mt="4w">
              <Heading as="h1" variant="h6" text="Responsables" />
              <ul>
                {emails.map((email, index) => (
                  <li key={`owner-${index}`}>{email}</li>
                ))}
              </ul>
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
            </Box>
            <Box mt="4w">Le siren fournit est invalide.</Box>
          </Box>
        </MessageProvider>
      );
    return null;
  }
};

export default MesEntreprisesPage;
