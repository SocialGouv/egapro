import type { PropsWithChildren } from "react";
import React from "react";
import { useMountedState } from "react-use";

import { useUser } from "@services/apiClient";

export const ClientAuthenticatedOnly = ({ children, ...delegated }: PropsWithChildren<unknown>) => {
  const isMounted = useMountedState();
  const { isAuthenticated } = useUser({ redirectTo: "/ecart-rep/email" });

  // No display server side.
  if (!isMounted || !isAuthenticated) return null;

  return <div {...delegated}>{children}</div>;
};
