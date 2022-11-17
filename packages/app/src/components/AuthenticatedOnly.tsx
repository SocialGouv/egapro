import { useUser } from "@services/apiClient";
import type { PropsWithChildren } from "react";

/**
 * Boundary component to check if user is authenticated. If not, it will be redirect to email page.
 * It not renders children until the auth check is completed.
 *
 * @param disableAuth If true, this component simply renders the children (transparent component). Convenient in some situations.
 */
export const AuthenticatedOnly = ({
  children,
  disableAuth,
  ...delegated
}: PropsWithChildren<unknown> & { disableAuth?: boolean | undefined }) => {
  const { isAuthenticated, loading } = useUser({
    ...(!disableAuth && { redirectTo: "/representation-equilibree/email" }),
  });

  if (disableAuth === true) {
    return <div {...delegated}>{children}</div>;
  }

  if (loading || !isAuthenticated) return null;

  return <div {...delegated}>{children}</div>;
};
