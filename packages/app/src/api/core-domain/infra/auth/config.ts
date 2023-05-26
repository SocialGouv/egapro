import { config } from "@common/config";
import { type AuthOptions, type CookiesOptions } from "next-auth";

function defaultCookies(useSecureCookies: boolean): CookiesOptions {
  const cookiePrefix = useSecureCookies ? "__Secure-" : "";
  return {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15,
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15,
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  };
}

const cookies = defaultCookies(false);
export const authBaseConfig: Pick<AuthOptions, "cookies" | "pages" | "secret" | "useSecureCookies"> = {
  secret: config.api.security.jwtv1.secret,
  pages: {
    signIn: "/login",
  },
  // cookies: {
  //   ...cookies,
  //   // pkceCodeVerifier: {
  //   //   ...cookies.pkceCodeVerifier,
  //   //   options: {
  //   //     ...cookies.pkceCodeVerifier.options,
  //   //     sameSite: "none",
  //   //   },
  //   // },
  //   // csrfToken: {
  //   //   ...cookies.csrfToken,
  //   //   options: {
  //   //     ...cookies.csrfToken.options,
  //   //     sameSite: "none",
  //   //   },
  //   // },
  //   state: {
  //     ...cookies.state,
  //     options: {
  //       ...cookies.state.options,
  //       sameSite: "none",
  //     },
  //   },
  // },
};
