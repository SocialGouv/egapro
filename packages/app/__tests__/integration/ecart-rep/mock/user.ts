import type { TokenInfoType } from "@services/apiClient";

export const FAKE_SIREN = "23274530763485";

/**
 * @link https://www.pappers.fr/entreprise/boulangerie-eden-833169014
 */
const BOULANGERIE_EDEN_SIREN = "833169014";

export const FAKE_USER: TokenInfoType = {
  staff: true,
  déclarations: [],
  email: "test@test.com",
  ownership: [FAKE_SIREN, BOULANGERIE_EDEN_SIREN],
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
