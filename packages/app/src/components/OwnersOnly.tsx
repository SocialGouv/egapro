import { useUser } from "@services/apiClient";
import type { PropsWithChildren } from "react";

import { Alert, AlertTitle } from "../design-system/base/Alert";

export const OwnersOnly = ({
  children,
  siren,
  ...delegated
}: PropsWithChildren<unknown> & { siren: string | undefined }) => {
  const { user, loading } = useUser({ redirectTo: "/representation-equilibree/email" });

  if (loading || siren === undefined) return null;

  if (!user?.ownership.find(elt => elt === siren) && !user?.staff) {
    return (
      <Alert type="error" size="sm" mb="4w">
        <AlertTitle>Erreur</AlertTitle>
        <p>Vous n'êtes pas autorisé pour ce Siren.</p>
      </Alert>
    );
  }
  return <div {...delegated}>{children}</div>;
};
