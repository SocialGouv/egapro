import type { TokenInfoType } from "@services/apiClient";

export const MALFORMED_SIREN = "23274530763485";
export const FAKE_SIREN = "232745307";
export const NOT_LINKED_SIREN = "504920166";
export const VALID_SIREN = "905292694";
export const VALID_SIREN2 = "403052111";
/**
 * @link https://www.pappers.fr/entreprise/boulangerie-eden-833169014
 */
const BOULANGERIE_EDEN_SIREN = "833169014";
const BOULANGER_SAS = "905292694";

export const FAKE_USER: TokenInfoType = {
  staff: true,
  déclarations: [],
  email: "demo@travail.gouv.fr",
  ownership: [FAKE_SIREN, BOULANGERIE_EDEN_SIREN, BOULANGER_SAS],
};

export const useUserMock = (isConnected: boolean) => {
  const useUserStore = () => ({
    setToken: () => undefined,
    token: "ega-token",
  });
  useUserStore.getState = () => ({
    token: "ega-token",
  });
  return {
    useUserStore,
    useUser() {
      if (isConnected) {
        return {
          isAuthenticated: true,
          logout: () => undefined,
          user: FAKE_USER,
          error: undefined,
        };
      } else {
        return {
          isAuthenticated: false,
          logout: () => undefined,
          user: undefined,
          error: undefined,
        };
      }
    },
  };
};
