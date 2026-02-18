"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { signIn, useSession } from "next-auth/react";

export const SwitchOrganizationButton = () => {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <Button
      iconId="fr-icon-building-line"
      onClick={() =>
        signIn("proconnect", { callbackUrl: "/" }, { prompt: "select_organization" })
      }
    >
      Changer d'organisation
    </Button>
  );
};
