"use client";

import { Heading } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { useSession } from "next-auth/react";
import { type PropsWithChildren } from "react";

export const CheckLogged = ({ children }: PropsWithChildren) => {
  const session = useSession();

  return (
    <ClientAnimate>
      {(() => {
        switch (session.status) {
          case "unauthenticated":
            return <>{children}</>;
          case "loading":
            return <Heading as="h4" text="Vérification de l'authentification ...." />;
          default:
            return <Heading as="h4" text="Vous êtes déjà connecté·e." />;
        }
      })()}
    </ClientAnimate>
  );
};
