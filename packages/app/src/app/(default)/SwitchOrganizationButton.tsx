"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { useSession } from "next-auth/react";

export const SwitchOrganizationButton = () => {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <Button
      iconId="fr-icon-building-line"
      linkProps={{
        href: "/api/auth/proconnect-logout?switchOrg",
      }}
    >
      Changer d'organisation
    </Button>
  );
};
