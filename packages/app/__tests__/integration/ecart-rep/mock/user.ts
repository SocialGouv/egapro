import type { TokenInfoType } from "@services/apiClient";

const FAKE_SIREN = "23274530763485";

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

export const useUserMock = (isConnected: boolean) => ({
  useUserStore() {
    return {
      setToken: () => void 0,
      token: "ega-token",
    };
  },
  useUser() {
    if (isConnected) {
      return {
        isAuthenticated: true,
        logout: () => void 0,
        user: FAKE_USER,
        error: void 0,
      };
    } else {
      return {
        isAuthenticated: false,
        logout: () => void 0,
        user: void 0,
        error: void 0,
      };
    }
  },
});
