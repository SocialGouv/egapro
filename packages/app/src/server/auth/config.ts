import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import { env } from "~/env";
import { extractSiren } from "~/modules/domain";
import { db } from "~/server/db";
import { accounts, companies, userCompanies, users } from "~/server/db/schema";
import { fetchCompanyBySiren } from "~/server/services/weez";

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			siret?: string | null;
			phone?: string | null;
		} & DefaultSession["user"];
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		siret?: string | null;
		phone?: string | null;
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
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	providers: getProviders(),
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
	}),
	events: {
		async signIn({ user, profile }) {
			const p = profile as Record<string, unknown> | undefined;
			const siret = p?.siret ? (p.siret as string) : null;
			const firstName = p?.firstName ? (p.firstName as string) : null;
			const lastName = p?.lastName ? (p.lastName as string) : null;

			if (!user.id) return;

			await db.transaction(async (tx) => {
				const updates: Record<string, string | null> = {};
				if (siret) updates.siret = siret;
				if (firstName) updates.firstName = firstName;
				if (lastName) updates.lastName = lastName;

				if (Object.keys(updates).length > 0) {
					await tx.update(users).set(updates).where(eq(users.id, user.id));
				}

				if (siret) {
					const siren = extractSiren(siret);

					let companyValues: {
						siren: string;
						name: string;
						address?: string | null;
						nafCode?: string | null;
						workforce?: number | null;
					};
					try {
						const companyInfo = await fetchCompanyBySiren(siren);
						companyValues = companyInfo
							? {
									siren,
									name: companyInfo.name,
									address: companyInfo.address,
									nafCode: companyInfo.nafCode,
									workforce: companyInfo.workforce,
								}
							: { siren, name: `Entreprise ${siren}` };
					} catch {
						companyValues = { siren, name: `Entreprise ${siren}` };
					}

					await tx
						.insert(companies)
						.values(companyValues)
						.onConflictDoUpdate({
							target: companies.siren,
							set: { ...companyValues, updatedAt: new Date() },
						});

					await tx
						.insert(userCompanies)
						.values({ userId: user.id, siren })
						.onConflictDoNothing();
				}
			});
		},
	},
	callbacks: {
		redirect({ url, baseUrl }) {
			if (url.startsWith(baseUrl)) {
				const path = url.slice(baseUrl.length);
				if (!path || path === "/") return `${baseUrl}/mon-espace`;
				return url;
			}
			if (url.startsWith("/")) {
				if (url === "/") return `${baseUrl}/mon-espace`;
				return `${baseUrl}${url}`;
			}
			return `${baseUrl}/mon-espace`;
		},
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				const dbUser = user as { siret?: string | null; phone?: string | null };
				token.siret = dbUser.siret ?? null;
				token.phone = dbUser.phone ?? null;
			}
			return token;
		},
		session: ({ session, token }) => ({
			...session,
			user: {
				...session.user,
				id: token.id,
				siret: token.siret ?? null,
				phone: token.phone ?? null,
			},
		}),
	},
} satisfies NextAuthOptions;
