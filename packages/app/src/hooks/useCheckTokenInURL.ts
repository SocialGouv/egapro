import { useRouter } from "next/router";
import { useEffect } from "react";

import { useUser } from "./useUser";

/**
 * Check if a token is present in the URL bar. If so, run login with it.
 *
 * Use this hook carefully, i.e. on pages which expect to be a landing page of an email token link, because the useEffect in this function is called at every render.
 */
export const useCheckTokenInURL = () => {
  const router = useRouter();
  const { login, loading } = useUser();

  // This useEffect is called at every render, because we attempt to login if there is a token in the URL.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    // Check also loading to not attempt a login call if a precedent login call is already initiated.
    if (token && !loading) {
      console.debug("Token trouvé dans l'URL. Tentative de connexion...");
      login(token);
      // Reset the token in the search params so it won't be in the URL and won't be bookmarkable (which is a bad practice?)
      router.push({ search: "" });
    }
  });
};
