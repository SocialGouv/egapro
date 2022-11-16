import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { PropsWithChildren } from "react";
import React from "react";

import { Alert, AlertTitle } from "../design-system/base/Alert";
import { useUser } from "@services/apiClient";

/**
 * Boundary component to check if user has ownership on the Siren or the user is a staff member.
 * It not renders children until the authorization check is completed.
 */
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
