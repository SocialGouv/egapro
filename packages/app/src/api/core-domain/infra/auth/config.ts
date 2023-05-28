import { config } from "@common/config";
import { type AuthOptions } from "next-auth";

export const authBaseConfig: Pick<AuthOptions, "pages" | "secret"> = {
  secret: config.api.security.auth.secret,
  pages: {
    signIn: "/login",
  },
};
