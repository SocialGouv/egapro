import { authConfig } from "@api/core-domain/infra/auth/config";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Heading } from "@design-system";
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
      <Box mb="10w">
        <Heading as="h1" text="Mes entreprises" />
        <Box mt="4w">
          Vous n'avez pas encore d'entreprises rattachés.
          <br />{" "}
          <a target="_blank" href="https://app.moncomptepro.beta.gouv.fr/users/start-sign-in">
            Connectez-vous sur Mon Compte Pro
          </a>{" "}
          et ajoutez votre entreprise.
        </Box>
      </Box>
    );
  const selectedSiren = typeof searchParams.siren === "string" ? searchParams.siren : sirenList[0];

  try {
    const emails = await getAllEmailsBySiren(selectedSiren);

    return (
      <Box mb="10w">
        <Heading as="h1" text="Mes entreprises" />
        <Box mt="2w">
          <SelectSiren sirenList={sirenList} />
        </Box>
        {typeof searchParams.siren === "string" && (
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
    );
  } catch (error: unknown) {
    if (error && error.constructor.name === "UnexpectedSessionError")
      return (
        <Box mb="10w">
          <Heading as="h1" text="Mes entreprises" />
          <Box mt="2w">
            <SelectSiren sirenList={sirenList} />
          </Box>
          <Box mt="4w">Le siren fournit est invalide.</Box>
        </Box>
      );
    return null;
  }
};

export default MesEntreprisesPage;
