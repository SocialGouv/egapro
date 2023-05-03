import { authBaseConfig } from "@api/core-domain/infra/auth/config";
import { egaproNextAuthAdapter } from "@api/core-domain/infra/auth/EgaproNextAuthAdapter";
import { globalMailerService } from "@api/core-domain/infra/mail";
import { UnexpectedError } from "@common/shared-domain";
import { type NextRouteHandler } from "@common/utils/next";
import { StatusCodes } from "http-status-codes";
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      staff: boolean;
    };
  }
}

const handler = NextAuth({
  ...authBaseConfig,
  // need a very basic adapter for EmailProvider
  adapter: egaproNextAuthAdapter,
  // force session to be stored as jwt in cookie instead of database
  session: {
    strategy: "jwt",
  },
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier: to, url }) {
        await globalMailerService.init();
        const [, rejected] = await globalMailerService.sendMail("login_sendVerificationUrl", { to }, url);
        if (rejected.length) {
          throw new UnexpectedError(`Cannot send verification request to email(s) : ${rejected.join(", ")}`);
        }
      },
    }),
  ],
  callbacks: {
    session({ session }) {
      if (session.user) {
        session.user.staff = false;
        (session.user as any).toto = "AHAHAHA";
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };

// make sure mail clients like Outlook will not hit the verification request and invalidate it
export const HEAD: NextRouteHandler<"...nextauth"> = () => {
  return new Response(null, {
    status: StatusCodes.OK,
  });
};
