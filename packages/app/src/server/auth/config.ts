import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
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
			siret?: string | null;
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
					siret: profile.siret ?? null,
				};
			},
		});
	}

	return providers;
}

export const authConfig = {
	pages: {
		signIn: "/login",
	},
	providers: getProviders(),
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),
	events: {
		async signIn({ user, profile }) {
			const siret =
				profile &&
				"siret" in profile &&
				(profile as Record<string, unknown>).siret
					? ((profile as Record<string, unknown>).siret as string)
					: env.NODE_ENV === "development"
						? "53284719600042"
						: null;
			if (siret && user.id) {
				await db.update(users).set({ siret }).where(eq(users.id, user.id));
			}
		},
	},
	callbacks: {
		redirect({ url, baseUrl }) {
			// After sign-in, always redirect to /declaration
			if (url.startsWith(baseUrl)) return url;
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			return `${baseUrl}/declaration`;
		},
		session: ({
			session,
			user,
		}: {
			session: DefaultSession & {
				user?: { id?: string; siret?: string | null };
			};
			user: { id: string; siret?: string | null };
		}) => ({
			...session,
			user: {
				...session.user,
				id: user.id,
				siret: user.siret,
			},
		}),
	},
} satisfies NextAuthOptions;
