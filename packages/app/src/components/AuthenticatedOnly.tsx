import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useUser } from "@services/apiClient";
import type { PropsWithChildren } from "react";

import { Alert, AlertTitle } from "../design-system/base/Alert";

export const AuthenticatedOnly = ({ children, ...delegated }: PropsWithChildren<unknown>) => {
  const { isAuthenticated, loading } = useUser({ redirectTo: "/representation-equilibree/email" });

  if (loading || !isAuthenticated) return null;

  return <div {...delegated}>{children}</div>;
};

export const StaffOnly = ({ children, ...delegated }: PropsWithChildren<unknown>) => {
  const { user, loading } = useUser({ redirectTo: "/representation-equilibree/email" });
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  if (loading || !user) return null;

  if (!user?.staff)
    return (
      <div ref={animationParent} style={{ marginBottom: 20 }}>
        <Alert type="error">
          <AlertTitle>Contrôle d'accès</AlertTitle>
          Vous n'avez pas les droits pour accéder à cette page.
        </Alert>
      </div>
    );

  return <div {...delegated}>{children}</div>;
};
