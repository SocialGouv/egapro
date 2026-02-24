import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import { env } from "~/env";
import { db } from "~/server/db";
import {
	accounts,
	sessions,
	users,
	verificationTokens,
} from "~/server/db/schema";

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
		} & DefaultSession["user"];
	}
}

function getProviders(): Provider[] {
	const providers: Provider[] = [];

	if (
		env.EGAPRO_PROCONNECT_ISSUER &&
		env.EGAPRO_PROCONNECT_CLIENT_ID &&
		env.EGAPRO_PROCONNECT_CLIENT_SECRET
	) {
		providers.push({
			id: "proconnect",
			name: "ProConnect",
			type: "oauth",
			wellKnown: `${env.EGAPRO_PROCONNECT_ISSUER}/.well-known/openid-configuration`,
			clientId: env.EGAPRO_PROCONNECT_CLIENT_ID,
			clientSecret: env.EGAPRO_PROCONNECT_CLIENT_SECRET,
			authorization: {
				params: {
					scope: "openid email given_name usual_name siret",
				},
			},
			idToken: true,
			profile(profile: Record<string, string>) {
				return {
					id: profile.sub ?? "",
					name:
						[profile.given_name, profile.usual_name]
							.filter(Boolean)
							.join(" ") ||
						profile.email ||
						"",
					email: profile.email ?? "",
				};
			},
		});
	}

	return providers;
}

export const authConfig = {
	providers: getProviders(),
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),
	logger: {
		error: () => {},
		warn: () => {},
		debug: () => {},
	},
	callbacks: {
		session: ({
			session,
			user,
		}: {
			session: DefaultSession & { user?: { id?: string } };
			user: { id: string };
		}) => ({
			...session,
			user: {
				...session.user,
				id: user.id,
			},
		}),
	},
} satisfies NextAuthOptions;
