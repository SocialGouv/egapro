"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { signIn, signOut, useSession } from "next-auth/react";

export const SwitchOrganizationButton = () => {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <Button
      iconId="fr-icon-building-line"
      onClick={async () => {
        // Clear NextAuth session only (keep ProConnect session alive so
        // the user doesn't have to re-authenticate).
        await signOut({ redirect: false });
        // Pass a dummy siret_hint that won't match the currently selected
        // organization. This triggers ProConnect's choose_organization
        // prompt which redirects to /users/select-organization.
        await signIn("proconnect", { callbackUrl: "/" }, { siret_hint: "_" });
      }}
    >
      Changer d'organisation
    </Button>
  );
};
