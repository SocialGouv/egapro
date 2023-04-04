import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { useFormManager } from "./useFormManager";
import { useMe } from "./useMe";

const TOKEN_KEY = "ega-token";
const LEGACY_TOKEN_KEY = "token";
const LEGACY_TOKEN_INFO_KEY = "tokenInfo";

interface PersistedTokenState {
  state: {
    token: string;
  };
  version: number;
}

const SyncLegacyTokenStorage: StateStorage = {
  getItem(key) {
    if (key === TOKEN_KEY) {
      let currentStateToken = localStorage.getItem(TOKEN_KEY);
      const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
      if (currentStateToken) {
        const parsedStatedToken = JSON.parse(currentStateToken) as PersistedTokenState;
        // if no token in state, but legacy token is found, it means that we were connected from simu or decla
        if (!parsedStatedToken.state.token && legacyToken) {
          console.debug("Auth state empty, but legacy token found.");
          currentStateToken = JSON.stringify({
            state: {
              token: legacyToken,
            },
            version: 0,
          });
          localStorage.setItem(TOKEN_KEY, currentStateToken);
        } else {
          localStorage.setItem(LEGACY_TOKEN_KEY, parsedStatedToken.state.token);
        }
      }

      return currentStateToken;
    }
    return localStorage.getItem(key);
  },
  removeItem(key) {
    if (key === TOKEN_KEY) {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_INFO_KEY);
    }
    localStorage.removeItem(key);
  },
  setItem(key, value) {
    if (key === TOKEN_KEY) {
      if (!value) {
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        return localStorage.removeItem(LEGACY_TOKEN_INFO_KEY);
      }
      const parsedStatedToken = JSON.parse(value) as PersistedTokenState;
      localStorage.setItem(LEGACY_TOKEN_KEY, parsedStatedToken.state.token);
    }
    localStorage.setItem(key, value);
  },
};

type UserStore = {
  setToken: (token: string) => void;
  token: string;
};

export const useUserStore = create<UserStore>()(
  persist(
    set => {
      return {
        // get legacy token (if found) on store creation
        token: typeof localStorage !== "undefined" ? localStorage.getItem(LEGACY_TOKEN_KEY) ?? "" : "",
        setToken: (token: string) => set({ token }),
      };
    },
    {
      name: "ega-token", // name of item in the storage (must be unique)
      storage: createJSONStorage<UserStore>(() => SyncLegacyTokenStorage),
    },
  ),
);

/**
 * Hook to get the user data, to login with a token in an URL and to redirect to a page if no token is found.
 *
 * @example
 * ```ts
 * useUser({ redirectTo: "/authPage" }); => redirects to /authPage if no token are found in local storage
 * ```
 *
 * @example
 * ```ts
 * const {
 *  user,            // user data
 *  error,           // potential useSWR error in fetching user data
 *  logout,          // function to logout
 *  isAuthenticated, // helper to know if the user is authenticated
 *  loading,         // boolean set as true if the asynchron fetch to get user information is in progress
 * } = useUser();
 * ```
 */
export const useUser = ({ redirectTo }: { redirectTo?: string } = {}) => {
  const router = useRouter();

  const { token, setToken } = useUserStore(useCallback(state => state, []));
  const { user, error, loading } = useMe(token);

  const { resetFormData } = useFormManager();

  const logout = useCallback(() => {
    console.debug("logout");
    setToken("");
  }, [setToken]);

  // Automatic login via URL.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    // Check also loading to not attempt a login call if a precedent login call is already initiated.
    if (token) {
      console.debug("Token trouvé. Tentative de connexion...");

      resetFormData(); // Remove data in local storage on each new connection.

      setToken(token); // Order a re render of this hook.

      // Reset the token in the search params so it won't be in the URL and won't be bookmarkable (which is a bad practice?)
      router.push({ search: "" });
    }
  }, [token, resetFormData, router, setToken]);

  // Automatic redirect if not authenticated and redirectTo is present.
  useEffect(() => {
    if (redirectTo) {
      if (!token || error) {
        if (redirectTo) router.push(redirectTo);
      }
    }
  }, [error, token, redirectTo, router]);

  return {
    user,
    error,
    logout,
    isAuthenticated: Boolean(user?.email),
    loading,
  };
};
