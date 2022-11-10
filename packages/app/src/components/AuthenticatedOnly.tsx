import type { PropsWithChildren } from "react";
import React from "react";

import { useUser } from "@services/apiClient";

/**
 * Boundary component to check if user is authenticated. If not, it will be redirect to email page.
 * It not renders children until the auth check is completed.
 */
export const AuthenticatedOnly = ({ children, ...delegated }: PropsWithChildren<unknown>) => {
  const { isAuthenticated, loading } = useUser({ redirectTo: "/representation-equilibree/email" });

  if (loading || !isAuthenticated) return null;

  return <div {...delegated}>{children}</div>;
};
