import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

import { fetcher } from "../common/utils/fetcher";

// TODO: type à confirmer par rapport au endpoint /!\
type DeclarationSummary = {
  declared_at: number | null;
  modified_at: number;
  name: string | null;
  siren: string;
  year: number;
};

type TokenInfoType = {
  déclarations: DeclarationSummary[];
  email: string;
  ownership: string[];
  staff: boolean;
};

export const useUser = (props?: { redirectTo: string } | undefined) => {
  const redirectTo = props?.redirectTo;
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean | null>(null);
  const { data: user, error } = useSWR<TokenInfoType>(!token ? null : "/me", fetcher);

  const logout = useCallback(() => {
    console.debug("logout");
    localStorage.setItem("token", "");
    setToken(null);

    if (redirectTo) router.push(redirectTo);
  }, [redirectTo, router]);

  const login = (token: string) => {
    console.debug("dans login");
    setLoading(true);
    localStorage.setItem("token", token);
    setToken(token);
  };

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, [logout, redirectTo]);

  useEffect(() => {
    if (user || error) setLoading(false);
  }, [user, error]);

  return {
    user,
    error,
    login,
    logout,
    loading,
    isAuthenticated: Boolean(user?.email),
  };
};
