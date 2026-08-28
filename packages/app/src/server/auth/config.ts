import { and, eq, isNull } from "drizzle-orm";
import { headers as nextHeaders } from "next/headers";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers/index";
import { env } from "~/env";
import { sirenSchema } from "~/modules/admin/schemas";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { extractSiren, parseSiren } from "~/modules/domain";
import { devLoginSchema } from "~/modules/login/schemas";
import { logAction } from "~/server/audit/log";
import { buildRequestContext, toHeaders } from "~/server/audit/requestContext";
import { db } from "~/server/db";
import { toCompanyInsertValues } from "~/server/db/companyInsert";
import {
	adminImpersonationEvents,
	companies,
	userCompanies,
	users,
} from "~/server/db/schema";
import { fetchCompanyBySiren } from "~/server/services/weez";
import { parseAdminEmails } from "./parseAdminEmails";

/** Cap on the `name` field of an impersonation payload — avoids oversized
 *  tokens if an admin forges a huge string in the `session.update` call. */
const IMPERSONATION_NAME_MAX = 255;

/**
 * Close every open impersonation row for this admin. Run on stop, and
 * also before inserting a new row so `(adminUserId) WHERE stoppedAt IS
 * NULL` always has at most one row.
 */
async function closeOpenImpersonationEvents(adminUserId: string) {
	await db
		.update(adminImpersonationEvents)
		.set({ stoppedAt: new Date() })
		.where(
			and(
				eq(adminImpersonationEvents.adminUserId, adminUserId),
				isNull(adminImpersonationEvents.stoppedAt),
			),
		);
}

/**
 * Persist the start of an impersonation session atomically:
 * close any previously open session, ensure the company row exists (so
 * the FK on the audit table holds), then insert the new event.
 *
 * The company upsert uses `onConflictDoNothing` — an admin impersonating
 * a company must never silently overwrite metadata visible to its real
 * referents.
 */
async function recordImpersonationStart(
	adminUserId: string,
	siren: string,
	name: string,
) {
	await db.transaction(async (tx) => {
		await tx
			.insert(companies)
			.values({ siren, name })
			.onConflictDoNothing({ target: companies.siren });

		await tx
			.update(adminImpersonationEvents)
			.set({ stoppedAt: new Date() })
			.where(
				and(
					eq(adminImpersonationEvents.adminUserId, adminUserId),
					isNull(adminImpersonationEvents.stoppedAt),
				),
			);

		await tx.insert(adminImpersonationEvents).values({
			adminUserId,
			siren,
		});
	});
}

/**
 * Active impersonation targeted by an admin. When set, the admin is browsing
 * the app as if they were the referent of the given company. Only meaningful
 * when `user.isAdmin === true`; the `jwt` callback guards the trigger.
 */
export type Impersonation = {
	siren: string;
	name: string;
};

/**
 * Read the request context (IP, user-agent) from the active Next.js request.
 *
 * NextAuth events do not receive the request directly, so we rely on the
 * Next.js per-request AsyncLocalStorage exposed by `next/headers`. Returns
 * empty context if called outside a request scope (tests, edge cases).
 */
async function safeRequestContext() {
	try {
		const headerStore = await nextHeaders();
		return buildRequestContext(toHeaders(headerStore));
	} catch {
		return { ipAddress: null, userAgent: null };
	}
}

/**
 * Whitelist-based extraction of safe metadata fields from a NextAuth error
 * payload. NextAuth occasionally embeds OAuth tokens / state / code_verifier
 * in error metadata — JSON.stringify-ing the whole object would leak them
 * into `audit.action_log.error_message`.
 */
function buildAuthErrorMessage(code: string, metadata: unknown): string {
	if (metadata instanceof Error) {
		return `${code}: ${metadata.message}`.slice(0, 1000);
	}
	if (typeof metadata !== "object" || metadata === null) {
		return `${code}: ${String(metadata)}`.slice(0, 1000);
	}
	const safe: Record<string, string> = {};
	const m = metadata as Record<string, unknown>;
	for (const key of ["type", "provider", "providerType", "name"] as const) {
		const value = m[key];
		if (typeof value === "string") safe[key] = value;
	}
	const innerError = m.error;
	if (innerError instanceof Error) {
		safe.error = innerError.message;
	} else if (typeof innerError === "string") {
		safe.error = innerError;
	}
	return `${code}: ${JSON.stringify(safe)}`.slice(0, 1000);
}

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			siret?: string | null;
			phone?: string | null;
			isAdmin: boolean;
			impersonation?: Impersonation | null;
		} & DefaultSession["user"];
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		siret?: string | null;
		phone?: string | null;
		id_token?: string | null;
		isAdmin: boolean;
		impersonation?: Impersonation | null;
	}
}

/**
 * Normalized set of admin emails parsed once from `ADMIN_EMAILS`.
 * The env var never changes at runtime, so we memoize it at module load.
 */
const ADMIN_EMAILS: Set<string> = parseAdminEmails(env.ADMIN_EMAILS);

/** Hosts the dev sign-in accepts, port stripped. */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * True when the request was addressed to this machine. `EGAPRO_DEV_AUTH` and
 * `NODE_ENV` both come from the same configmap and carry the same level of
 * trust, so on their own they are one barrier, not two. This check does not
 * read configuration at all: a request reaching a deployed pod carries that
 * environment's hostname, never a loopback one.
 */
function isLoopbackRequest(headers: Record<string, string> | undefined) {
	const host = headers?.host ?? headers?.Host;
	if (!host) return false;
	// Strip the port, keeping bracketed IPv6 literals intact.
	const hostname = host.startsWith("[")
		? host.slice(0, host.indexOf("]") + 1)
		: (host.split(":")[0] ?? "");
	return LOOPBACK_HOSTS.has(hostname);
}

/**
 * Dev-only sign-in. Trusts whatever email and SIRET the form supplies — it
 * exists so local dev and the pipeline's browser validators can reach
 * authenticated screens without the external ProConnect sandbox, and it must
 * never be reachable in a deployed environment.
 *
 * Three guards, only two of which share a trust domain: `EGAPRO_DEV_AUTH`
 * defaults to false, `getProviders()` throws if it is ever true while
 * `NODE_ENV` is production, and `authorize()` refuses any request that did
 * not arrive on a loopback host. The blast radius justifies the redundancy —
 * `authorize()` validates the *shape* of an identity, never a secret, and the
 * `jwt` callback grants admin to any email listed in `ADMIN_EMAILS`.
 *
 * The returned shape is the same one the ProConnect `profile()` callback
 * produces, so the `jwt` callback below (user upsert, company linking, admin
 * flag) runs identically for both providers.
 */
function devAuthProvider(): Provider {
	return CredentialsProvider({
		id: "dev-auth",
		name: "Connexion de développement",
		credentials: {
			email: { label: "Adresse e-mail", type: "email" },
			siret: { label: "SIRET", type: "text" },
		},
		authorize(credentials, req) {
			if (!isLoopbackRequest(req?.headers)) return null;

			const parsed = devLoginSchema.safeParse({
				email: credentials?.email ?? "",
				siret: credentials?.siret ?? "",
			});
			if (!parsed.success) return null;

			const { email, siret } = parsed.data;
			const localPart = email.split("@")[0] ?? email;
			return {
				id: email,
				name: localPart,
				email,
				siret,
				firstName: localPart,
				lastName: null,
			};
		},
	});
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

	// Strict `=== true`, never truthiness: with SKIP_ENV_VALIDATION set (every
	// `next build`) the env helper hands back the raw environment, where the
	// string "false" is truthy — `EGAPRO_DEV_AUTH=false` at build time would
	// otherwise take this branch and abort the build.
	if (env.EGAPRO_DEV_AUTH === true) {
		// Fail loudly rather than silently registering a password-less
		// provider on a deployed environment.
		if (env.NODE_ENV === "production") {
			throw new Error(
				"EGAPRO_DEV_AUTH is enabled while NODE_ENV=production — refusing to register the dev sign-in provider.",
			);
		}
		providers.push(devAuthProvider());
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
		async jwt({ token, user, account, trigger, session: sessionUpdate }) {
			// Admin-triggered impersonation update. Guarded server-side: only
			// admins can set `impersonation`, and the only accepted shape is
			// either a full `{ siren, name }` object or `null` to stop.
			//
			// The audit trail (`app_admin_impersonation_event`) is written
			// atomically here so it always reflects the effective JWT state:
			// every row in the log corresponds to an actual live session.
			if (trigger === "update" && token.isAdmin && sessionUpdate) {
				const raw = (sessionUpdate as { impersonation?: unknown })
					.impersonation;

				if (raw === null) {
					await closeOpenImpersonationEvents(token.id);
					token.impersonation = null;
					return token;
				}

				if (raw && typeof raw === "object") {
					const candidate = raw as { siren?: unknown; name?: unknown };
					const sirenResult = sirenSchema.safeParse(candidate.siren);
					const nameOk =
						typeof candidate.name === "string" &&
						candidate.name.length > 0 &&
						candidate.name.length <= IMPERSONATION_NAME_MAX;

					if (sirenResult.success && nameOk) {
						const siren = sirenResult.data;
						const name = candidate.name as string;
						await recordImpersonationStart(token.id, siren, name);
						token.impersonation = { siren, name };
					}
				}
				return token;
			}

			if (user) {
				const profileData = user as typeof user & {
					siret?: string | null;
					firstName?: string | null;
					lastName?: string | null;
				};

				// Find or create user by email (replaces DrizzleAdapter)
				const email = user.email;
				if (!email) {
					throw new Error("Missing email from auth profile");
				}

				const existingUser = await db.query.users.findFirst({
					where: eq(users.email, email),
				});

				let dbUser: NonNullable<typeof existingUser>;
				if (!existingUser) {
					const rows = await db
						.insert(users)
						.values({
							email,
							firstName: profileData.firstName ?? null,
							lastName: profileData.lastName ?? null,
						})
						.returning();
					const inserted = rows[0];
					if (!inserted) {
						throw new Error("Failed to create user");
					}
					dbUser = inserted;
				} else {
					// ProConnect only seeds a name the DB does not have yet.
					const updates: Record<string, string | null> = {};
					if (profileData.firstName && !existingUser.firstName)
						updates.firstName = profileData.firstName;
					if (profileData.lastName && !existingUser.lastName)
						updates.lastName = profileData.lastName;

					if (Object.keys(updates).length > 0) {
						await db
							.update(users)
							.set(updates)
							.where(eq(users.id, existingUser.id));
						dbUser = { ...existingUser, ...updates } as typeof existingUser;
					} else {
						dbUser = existingUser;
					}
				}

				// Link company (HTTP call outside transaction to avoid long locks)
				if (profileData.siret) {
					const siren = extractSiren(profileData.siret);

					let companyValues: ReturnType<typeof toCompanyInsertValues>;
					try {
						companyValues = toCompanyInsertValues(
							siren,
							await fetchCompanyBySiren(siren),
						);
					} catch {
						companyValues = toCompanyInsertValues(siren, null);
					}

					await db.transaction(async (tx) => {
						await tx
							.insert(companies)
							.values(companyValues)
							.onConflictDoUpdate({
								target: companies.siren,
								set: { ...companyValues, updatedAt: new Date() },
							});

						await tx
							.insert(userCompanies)
							.values({ userId: dbUser.id, siren })
							.onConflictDoNothing();
					});
				}

				// Sync the admin flag with `ADMIN_EMAILS` on every login.
				// Listing an email promotes the user; removing it demotes them.
				const shouldBeAdmin = ADMIN_EMAILS.has(email.toLowerCase());
				if (shouldBeAdmin !== dbUser.isAdmin) {
					await db
						.update(users)
						.set({ isAdmin: shouldBeAdmin })
						.where(eq(users.id, dbUser.id));
					dbUser = { ...dbUser, isAdmin: shouldBeAdmin };
				}

				token.id = dbUser.id;
				// The DB wins over the ProConnect name NextAuth put on the token.
				token.name =
					[dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") ||
					email;
				token.siret = profileData.siret ?? null;
				token.phone = dbUser.phone ?? null;
				token.id_token = account?.id_token ?? null;
				token.isAdmin = shouldBeAdmin;
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
				isAdmin: token.isAdmin ?? false,
				impersonation: token.impersonation ?? null,
			},
		}),
	},
	events: {
		async signIn({ user }) {
			const requestContext = await safeRequestContext();
			const profileData = user as typeof user & { siret?: string | null };
			void logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN,
				status: "success",
				userId: user.id ?? null,
				userEmail: user.email ?? null,
				siren: parseSiren(profileData.siret),
				ipAddress: requestContext.ipAddress,
				userAgent: requestContext.userAgent,
			});
		},
	},
	logger: {
		// NextAuth v4 expects a synchronous `(code, metadata) => void` logger.
		// We keep the signature synchronous and dispatch the async audit write
		// inside a detached promise so NextAuth never awaits our side-effect.
		error(code, metadata) {
			// Log NextAuth-level errors that match a sign-in/callback failure
			// — issue #3174 (failed login auditing).
			if (
				!code.includes("SIGNIN") &&
				!code.includes("CALLBACK") &&
				!code.includes("OAUTH") &&
				!code.includes("JWT_SESSION")
			) {
				return;
			}
			void (async () => {
				const requestContext = await safeRequestContext();
				await logAction({
					action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
					status: "failure",
					errorMessage: buildAuthErrorMessage(code, metadata),
					ipAddress: requestContext.ipAddress,
					userAgent: requestContext.userAgent,
				});
			})();
		},
		warn() {},
		debug() {},
	},
} satisfies NextAuthOptions;
