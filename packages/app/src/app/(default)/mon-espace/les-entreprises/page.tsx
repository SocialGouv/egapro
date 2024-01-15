import { authConfig } from "@api/core-domain/infra/auth/config";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Heading } from "@design-system";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getAllEmailsBySiren } from "../actions";
import { SirenInput } from "./SirenInput";

const MesEntreprisesPage = async ({ searchParams }: NextServerPageProps<never, "siren">) => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");
  if (!session.user.staff) redirect("/mon-espace/mon-profil");

  if (typeof searchParams.siren !== "string")
    return (
      <Box mb="10w">
        <Heading as="h1" text="Les entreprises" />
        <Box mt="2w">
          <SirenInput />
        </Box>
      </Box>
    );

  const selectedSiren = searchParams.siren;

  try {
    const emails = await getAllEmailsBySiren(selectedSiren);

    return (
      <Box mb="10w">
        <Heading as="h1" text="Les entreprises" />
        <Box mt="2w">
          <SirenInput loadedSiren={selectedSiren} />
        </Box>
        <Box mt="4w">
          <Heading as="h1" variant="h6" text="Responsables" />
          <ul>
            {emails.map((email, index) => (
              <li key={`owner-${index}`}>{email}</li>
            ))}
          </ul>
        </Box>
      </Box>
    );
  } catch (error: unknown) {
    if (error && error.constructor.name === "UnexpectedSessionError")
      return (
        <Box mb="10w">
          <Heading as="h1" text="Les entreprises" />
          <Box mt="2w">
            <SirenInput />
          </Box>
          <Box mt="4w">Pas d'utilisateur pour ce Siren ou Url invalide</Box>
        </Box>
      );
    return null;
  }
};

export default MesEntreprisesPage;
