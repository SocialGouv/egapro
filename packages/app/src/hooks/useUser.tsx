import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import create from "zustand";
import { persist } from "zustand/middleware";

import { useMe } from "./useMe";

type UserStore = {
  setToken: (token: string) => void;
  token: string;
};

export const useUserStore = create<UserStore>()(
  persist(
    set => ({
      token: "",
      setToken: (token: string) => set({ token }),
    }),
    {
      name: "userStore", // name of item in the storage (must be unique)
    },
  ),
);

/**
 * Hook to get the user data, to login with a token in an URL and to redirect to a page if no token is found.
 *
 * Usage:
 * useUser({ redirectTo: "/authPage" }) => redirect to /authPage if no token are found in local storage
 * useUser({ checkTokenInUrl: true }) => make a Next page able to detect & use a token in URL and put it in local storage in order to login automatically
 * const {
 *  user, // get user data
 *  error, // SWR error if any in fetching user data
 *  logout, // function to logout
 *  isAuthenticated, // helper to know if the user is authenticated
 * } = useUser()
 *
 */
export const useUser = (props: { checkTokenInURL?: boolean; redirectTo?: string } = {}) => {
  const redirectTo = props.redirectTo;
  const router = useRouter();

  const token = useUserStore(state => state.token);
  const setToken = useUserStore(state => state.setToken);

  const { user, error } = useMe(token);

  const logout = useCallback(() => {
    console.debug("logout");
    setToken("");
  }, [setToken]);

  // Automatic login via URL.
  useEffect(() => {
    if (props.checkTokenInURL) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      // Check also loading to not attempt a login call if a precedent login call is already initiated.
      if (token) {
        console.debug("Token trouvé dans l'URL. Tentative de connexion...");
        setToken(token || "");
        // Reset the token in the search params so it won't be in the URL and won't be bookmarkable (which is a bad practice?)
        router.push({ search: "" });
      }
    }
  });

  // Automatic redirect if not authenticated.
  useEffect(() => {
    if (props.redirectTo) {
      if (!token) {
        if (redirectTo) router.push(redirectTo);
      }
    }
  }, [token, redirectTo, router, props.redirectTo]);

  return {
    user,
    error,
    logout,
    isAuthenticated: Boolean(user?.email),
  };
};
