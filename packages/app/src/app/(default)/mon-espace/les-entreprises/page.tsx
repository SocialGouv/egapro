import { authConfig } from "@api/core-domain/infra/auth/config";
import { config } from "@common/config";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Heading } from "@design-system";
import { MessageProvider } from "@design-system/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getAllEmailsBySiren } from "../actions";
import { AddOwnershipForm } from "../AddOwnershipForm";
import { EmailOwnerList } from "../EmailOwnerList";
import { MesEntreprisesInfoAlert } from "../mes-entreprises/page";
import { SirenInput } from "./SirenInput";

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
