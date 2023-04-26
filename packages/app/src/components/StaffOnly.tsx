import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useUser } from "@services/apiClient";
import { useRouter } from "next/router";
import { type PropsWithChildren, type ReactNode } from "react";

import { Alert, AlertTitle } from "../design-system/base/Alert";

export interface StaffOnlyProps {
  placeholder?: ReactNode;
}

/**
 * Boundary component to check if user has ownership on the Siren or the user is a staff member.
 * It not renders children until the authorization check is completed.
 */
export const StaffOnly = ({ children, placeholder, ...delegated }: PropsWithChildren<StaffOnlyProps>) => {
  const router = useRouter();
  const { user, loading } = useUser({
    redirectTo: `/representation-equilibree/email?redirectTo=${encodeURI(router.pathname)}`,
  });
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  if (loading || !user) return <>{placeholder}</> ?? null;

  if (!user.staff)
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
