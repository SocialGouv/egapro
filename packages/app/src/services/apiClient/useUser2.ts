"use client";

import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";

export type UseUser = (params?: { redirectTo?: string; required?: boolean }) => {
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  user?: Session["user"];
};

export const useUser2: UseUser = ({ required = false } = {}) => {
  const router = useRouter();
  const session = useSession({
    required,
  });

  const loading = session.status === "loading";
  const isAuthenticated = !!session.data;

  return {
    user: session.data?.user,
    isAuthenticated,
    loading,
    logout: async () => {
      const { url } = await signOut({ redirect: false, callbackUrl: "/" });
      router.push(url);
    },
  };
};
