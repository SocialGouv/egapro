import { type OAuthConfig, type OAuthUserConfig } from "next-auth/providers";
import { type GithubProfile } from "next-auth/providers/github";

/** @deprecated Not used yet */
export function GithubOAuth2ProxyProvider<P extends GithubProfile>(
  options: Omit<OAuthUserConfig<P>, "issuer">,
): OAuthConfig<P> {
  return {
    id: "github-proxy",
    name: "Github",
    type: "oauth",
    version: "2.0",
    authorization: {
      url: "http://localhost:4180/oauth2/start",
      params: {
        scope: "openid profile email",
        response_type: "code",
      },
    },
    profileUrl: "http://localhost:4180/oauth2/userinfo",
    profile(profile) {
      return {
        id: profile.sub,
        email: profile.email,
        name: profile.given_name,
      };
    },
    options,
  };
}
