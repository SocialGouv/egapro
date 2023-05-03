import { config } from "@common/config";
import { type AuthOptions } from "next-auth";

export const authBaseConfig: Pick<AuthOptions, "pages" | "secret"> = {
  secret: config.api.security.jwtv1.secret,
  pages: {
    signIn: "/representation-equilibree/email",
  },
};
