import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import { env } from "~/env";
import { db } from "~/server/db";
import {
	accounts,
	companies,
	sessions,
	userCompanies,
	users,
	verificationTokens,
} from "~/server/db/schema";
import { fetchCompanyName } from "~/server/services/weez";

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			siret?: string | null;
			phone?: string | null;
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
			async profile(_profile, tokens) {
				const wellKnownUrl = `${env.EGAPRO_PROCONNECT_ISSUER}/.well-known/openid-configuration`;
				const configResponse = await fetch(wellKnownUrl);
				const config = (await configResponse.json()) as {
					userinfo_endpoint: string;
				};
				const response = await fetch(config.userinfo_endpoint, {
					headers: {
						Authorization: `Bearer ${tokens.access_token}`,
					},
				});
				const body = await response.text();
				// ProConnect returns userinfo as a signed JWT, decode the payload
				let userinfo: Record<string, string>;
				if (body.startsWith("{")) {
					userinfo = JSON.parse(body) as Record<string, string>;
				} else {
					const payload = body.split(".")[1];
					if (!payload) throw new Error("Invalid JWT from userinfo");
					userinfo = JSON.parse(
						Buffer.from(payload, "base64url").toString("utf-8"),
					) as Record<string, string>;
				}
				return {
					id: userinfo.sub ?? "",
					name:
						[userinfo.given_name, userinfo.usual_name]
							.filter(Boolean)
							.join(" ") ||
						userinfo.email ||
						"",
					email: userinfo.email ?? "",
					siret: userinfo.siret ?? null,
					firstName: userinfo.given_name ?? null,
					lastName: userinfo.usual_name ?? null,
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
			const p = profile as Record<string, unknown> | undefined;
			const siret = p?.siret ? (p.siret as string) : null;
			const firstName = p?.firstName ? (p.firstName as string) : null;
			const lastName = p?.lastName ? (p.lastName as string) : null;

			if (user.id) {
				const updates: Record<string, string | null> = {};
				if (siret) updates.siret = siret;
				if (firstName) updates.firstName = firstName;
				if (lastName) updates.lastName = lastName;

				if (Object.keys(updates).length > 0) {
					await db.update(users).set(updates).where(eq(users.id, user.id));
				}

				// Associate user with company from ProConnect SIRET
				if (siret) {
					const siren = siret.slice(0, 9);
					const companyName = await fetchCompanyName(siren);

					await db
						.insert(companies)
						.values({ siren, name: companyName })
						.onConflictDoUpdate({
							target: companies.siren,
							set: { name: companyName, updatedAt: new Date() },
						});

					await db
						.insert(userCompanies)
						.values({ userId: user.id, siren })
						.onConflictDoNothing();
				}
			}
		},
	},
	callbacks: {
		redirect({ url, baseUrl }) {
			// After sign-in, always redirect to /declaration-remuneration
			if (url.startsWith(baseUrl)) {
				const path = url.slice(baseUrl.length);
				// Redirect root or empty path to /declaration-remuneration
				if (!path || path === "/") return `${baseUrl}/declaration-remuneration`;
				return url;
			}
			if (url.startsWith("/")) {
				if (url === "/") return `${baseUrl}/declaration-remuneration`;
				return `${baseUrl}${url}`;
			}
			return `${baseUrl}/declaration-remuneration`;
		},
		session: ({
			session,
			user,
		}: {
			session: DefaultSession & {
				user?: { id?: string; siret?: string | null; phone?: string | null };
			};
			user: { id: string; siret?: string | null; phone?: string | null };
		}) => ({
			...session,
			user: {
				...session.user,
				id: user.id,
				siret: user.siret,
				phone: user.phone,
			},
		}),
	},
} satisfies NextAuthOptions;
