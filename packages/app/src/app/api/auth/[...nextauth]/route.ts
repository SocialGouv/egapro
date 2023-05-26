import { authBaseConfig } from "@api/core-domain/infra/auth/config";
import { egaproNextAuthAdapter } from "@api/core-domain/infra/auth/EgaproNextAuthAdapter";
import { type MonCompteProProfile, MonCompteProProvider } from "@api/core-domain/infra/auth/MonCompteProProvider";
import { globalMailerService } from "@api/core-domain/infra/mail";
import { ownershipRepo } from "@api/core-domain/repo";
import { config } from "@common/config";
import { UnexpectedError } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";
import { type NextRouteHandler } from "@common/utils/next";
import { StatusCodes } from "http-status-codes";
import NextAuth, { type Session } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";
import EmailProvider from "next-auth/providers/email";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      firstname?: string;
      lastname?: string;
      ownership: string[];
      phoneNumber?: string;
      staff: boolean;
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Profile extends MonCompteProProfile {}
}

declare module "next-auth/jwt" {
  type UserSession = Session["user"];
  interface JWT extends DefaultJWT, UserSession {
    email: string;
  }
}

const handler = NextAuth({
  ...authBaseConfig,
  debug: config.env === "dev",
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
    ...(config.ff.moncomptepro ? [MonCompteProProvider(config.api.security.moncomptepro)] : []),
  ],
  callbacks: {
    // prefill JWT encoded data with staff and ownership
    async jwt({ token, profile, trigger }) {
      if (trigger !== "signUp") return token;
      if (profile?.email) {
        console.log("JWT PROFILE", { trigger, profile, token });
        token.ownership = profile.organizations.map(orga => orga.siret.substring(0, 9));
        token.staff = config.api.staff.includes(profile.email);
        token.firstname = profile.given_name ?? void 0;
        token.lastname = profile.family_name ?? void 0;
        token.phoneNumber = profile.phone_number ?? void 0;
      } else {
        console.log("JWT EMAIL SOON TO BE LEGACY", { trigger, token });
        token.ownership = await ownershipRepo.getAllSirenByEmail(new Email(token.email));
        token.staff = config.api.staff.includes(token.email);
      }
      return token;
    },

    // expose data from jwt to front
    session({ session, token }) {
      console.log("SESSION CHECKED", session, token);
      session.user.staff = token.staff;
      session.user.ownership = token.ownership;
      session.user.firstname = token.firstname;
      session.user.lastname = token.lastname;
      session.user.phoneNumber = token.phoneNumber;
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
