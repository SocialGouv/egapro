"use client";

import { useUserNext13 } from "@services/apiClient/useUserNext13";
import { redirect } from "next/navigation";
import { type PropsWithChildren } from "react";

interface BaseAuthenticatedUserProps {
  fallback: string;
}

type AuthenticatedUserProps =
  | Required<PropsWithChildren<BaseAuthenticatedUserProps>>
  | (BaseAuthenticatedUserProps & { redirectTo: string });

export const AuthenticatedUser = ({ fallback, ...rest }: AuthenticatedUserProps) => {
  const { user } = useUserNext13();
  if (user) {
    if ("redirectTo" in rest) redirect(rest.redirectTo);
    return <>{rest.children}</>;
  }
  redirect(fallback);
};
