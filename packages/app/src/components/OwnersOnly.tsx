import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { PropsWithChildren } from "react";
import React from "react";

import { Alert, AlertTitle } from "../design-system/base/Alert";
import { useUser } from "@services/apiClient";

export const OwnersOnly = ({
  children,
  siren,
  ...delegated
}: PropsWithChildren<unknown> & { siren: string | undefined }) => {
  const { user, loading } = useUser({ redirectTo: "/representation-equilibree/email" });
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  if (loading || siren === undefined) return null;

  if (!user?.ownership.find(elt => elt === siren) && !user?.staff) {
    return (
      <div ref={animationParent}>
        <Alert type="error" size="sm" mb="4w">
          <AlertTitle>Erreur</AlertTitle>
          <p>Vous n'êtes pas autorisé pour ce Siren.</p>
        </Alert>
      </div>
    );
  }
  return <div {...delegated}>{children}</div>;
};
