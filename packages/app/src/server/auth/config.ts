import { and, eq, isNull } from "drizzle-orm";
import { headers as nextHeaders } from "next/headers";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers/index";
import { env } from "~/env";
import { sirenSchema } from "~/modules/admin/schemas";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	extractSiren,
	isAdminMfaAcr,
	isAdminMfaFresh,
	parseSiren,
} from "~/modules/domain";
import { devLoginSchema } from "~/modules/login/schemas";
import { LOGIN } from "~/modules/routes";
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
 * Close the administration-journal row of a mimoquage whose second-factor
 * window has lapsed, and drop it from the token.
 *
 * A mimoquage stops biting the instant the window closes: `exposedImpersonation`
 * and `activeImpersonation` both stop honouring it, so the banner goes and the
 * server resolves the agent's own SIREN again. The open row has no such clock.
 * Closing it on sign-in alone would leave it open for the whole remaining life
 * of the session — weeks past the window — so the invariant the sign-in branch
 * states, no row open without a live mimoquage behind it, would hold against a
 * step-up but not against a window that simply lapses (issue #4466, S14).
 *
 * Emptying the token field is what keeps this from firing twice; a repeat costs
 * an index probe on `admin_impersonation_event_admin_started_idx`, which narrows
 * to this admin's own rows, and no write.
 */
async function closeLapsedImpersonation(
	token: {
		adminMfaAt?: number;
		id: string;
		impersonation?: Impersonation | null;
	},
	now: Date,
) {
	if (!token.impersonation) return;
	if (isAdminMfaFresh(token.adminMfaAt, now)) return;

	await closeOpenImpersonationEvents(token.id);
	token.impersonation = null;
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
			adminMfaAt?: number | null;
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
		// Seconds since the epoch. Absent when the level ProConnect returned
		// proved no second factor.
		adminMfaAt?: number;
	}
}

/**
 * Impersonation as the session exposes it: present only while the account is
 * an admin *and* its second factor is still inside the window.
 *
 * The banner reads `session.user.impersonation` and nothing else, so it
 * vanishes at the very instant the server stops honouring the mimoquage
 * (issue #4466, S14). The two must never diverge: a banner outliving the
 * privilege would invite an agent to act on a company whose SIREN the server
 * has already stopped resolving, and an effective mimoquage with no banner
 * would hide whose data is on screen.
 *
 * The token keeps its `impersonation` field untouched — this is a projection,
 * not a mutation. Nothing resumes when a new second factor is presented: a
 * step-up re-mints the token from scratch, without impersonation.
 */
function exposedImpersonation(
	token: JWTWithImpersonation,
	now: Date,
): Impersonation | null {
	if (!token.isAdmin) return null;
	if (!isAdminMfaFresh(token.adminMfaAt, now)) return null;
	return token.impersonation ?? null;
}

type JWTWithImpersonation = {
	isAdmin?: boolean;
	adminMfaAt?: number;
	impersonation?: Impersonation | null;
};

// Decoded without re-verifying the signature: this token never transited
// through the browser — NextAuth fetched it server-to-server and openid-client
// already validated signature, issuer, audience and nonce before handing it
// over, so a second check would re-run the same one against the same JWKS.
function readAuthenticationClaims(idToken: string | null | undefined): {
	acr: string | null;
	authTime: number | null;
} {
	const payload = idToken?.split(".")[1];
	if (!payload) return { acr: null, authTime: null };

	try {
		const claims = JSON.parse(
			Buffer.from(payload, "base64url").toString("utf-8"),
		) as Record<string, unknown>;
		const authTime = claims.auth_time;
		return {
			acr: typeof claims.acr === "string" ? claims.acr : null,
			authTime:
				typeof authTime === "number" &&
				Number.isFinite(authTime) &&
				authTime > 0
					? Math.floor(authTime)
					: null,
		};
	} catch {
		return { acr: null, authTime: null };
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
 * True when the request was addressed to this machine. `EGAPRO_DEV_AUTH`,
 * `EGAPRO_E2E_ADMIN_MFA` and `NODE_ENV` all come from the same configmap and
 * carry the same level of trust, so on their own they are one barrier, not
 * two. This check does not read configuration at all: a request reaching a
 * deployed pod carries that environment's hostname, never a loopback one.
 */
function isLoopbackHost(host: string | null | undefined) {
	if (!host) return false;
	// Strip the port, keeping bracketed IPv6 literals intact.
	const hostname = host.startsWith("[")
		? host.slice(0, host.indexOf("]") + 1)
		: (host.split(":")[0] ?? "");
	return LOOPBACK_HOSTS.has(hostname);
}

function isLoopbackRequest(headers: Record<string, string> | undefined) {
	return isLoopbackHost(headers?.host ?? headers?.Host);
}

/**
 * Host of the Next.js request in flight, or null outside a request scope.
 *
 * Read from the server's own view of the request, exactly as
 * `safeRequestContext` does. NextAuth callbacks do not receive the request,
 * and this is the only place the host can be obtained without letting a caller
 * hand us one.
 */
async function safeRequestHost(): Promise<string | null> {
	try {
		return (await nextHeaders()).get("host");
	} catch {
		return null;
	}
}

/**
 * Test-only stand-in for a ProConnect second factor (issue #4467).
 *
 * Why it exists. `/admin` demands an `eidas1-mfa` sign-in since #4461.
 * ProConnect's integration platform advertises that level, but its FIA1V2 test
 * identity — the only one the suite has — presents no second factor a headless
 * run can complete, and its fallback one-time code goes to a mailbox the suite
 * cannot read. Without a seam the whole backoffice half of the suite is
 * unreachable, which is worse for the epic than a seam whose absence in
 * production is mechanically checkable.
 *
 * Why it cannot leak. Two independent barriers, deliberately not two variables
 * of one configmap. `EGAPRO_E2E_ADMIN_MFA` is off by default and declared in no
 * `.kontinuous` env config — `e2eFlagsAbsentFromDeployConfig.test.ts` fails the
 * build if it ever appears in one. On top of it, the sign-in must have reached
 * the app on a loopback host, which no deployed pod ever sees whatever its
 * configuration says. Nothing in the request decides: no parameter, no header,
 * no body — `Host` is not an input the caller chooses freely here, it is what
 * the sign-in had to be addressed to in order to arrive at all.
 *
 * What it does NOT do. It grants no habilitation: `ADMIN_EMAILS` still decides
 * who is an admin, and the freshness window still applies. It replaces the
 * level ProConnect answered with, never the rule that reads it — so the
 * negative half of the epic (no valid second factor, no backoffice) stays live.
 *
 * Not locked on `NODE_ENV`: every CI run serves a production build
 * (`next build` then `next start`), so such a lock would make the seam inert in
 * the one environment that needs it. The campaign-clock seam already made and
 * reverted that mistake — see `~/app/api/e2e-clock/route.ts`.
 */
function grantsTestAdminMfa(host: string | null): boolean {
	// Strict `=== true`, never truthiness: with SKIP_ENV_VALIDATION set the env
	// helper hands back the raw environment, where the string "false" is truthy.
	return env.EGAPRO_E2E_ADMIN_MFA === true && isLoopbackHost(host);
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
		signIn: LOGIN,
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

				// Starting a mimoquage is itself an administrator privilege, so it
				// needs a second factor inside the window — the same condition the
				// shared predicates apply when *reading* through a mimoquage
				// (#4466). Gating only on `token.isAdmin` would let an agent whose
				// window has closed open a row in the administration journal that
				// no live mimoquage backs, which is precisely the invariant this
				// ticket exists to hold. It would also persist a client-supplied
				// company name without a valid second factor.
				//
				// Stopping stays ungated on purpose, above: ending a mimoquage and
				// closing its row must never be refused.
				if (!isAdminMfaFresh(token.adminMfaAt, new Date())) {
					// The refusal must not strand what the agent already had open:
					// an agent switching companies as the window lapses gets the
					// same treatment as one who simply stopped browsing.
					await closeLapsedImpersonation(token, new Date());
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

				// A sign-in — a step-up included — mints the token from scratch,
				// so the mimoquage disappears on its own. The open row in the
				// administration journal does not: close it here so there is no
				// instant at which a row is open without a live mimoquage behind
				// it. That journal is a compliance trail, not a by-product of the
				// banner (issue #4466, S14).
				//
				// Unconditional, and not gated on `shouldBeAdmin`: an account
				// dropped from `ADMIN_EMAILS` between two sign-ins would otherwise
				// leave its last row open for good. The statement is keyed on
				// `adminUserId`, so for the declarants — who never have a row — it
				// costs one index probe and no write.
				//
				// No automatic resume: the agent restarts the mimoquage from the
				// backoffice if they still need it.
				await closeOpenImpersonationEvents(dbUser.id);
				token.impersonation = null;

				// The marker has exactly two sources, and a client reaches
				// neither: the id_token of the exchange we just performed
				// server-to-server, and — off outside a loopback test run, see
				// `grantsTestAdminMfa` — the E2E seam. Never a query parameter, a
				// header, a request body, nor the `trigger === "update"` branch
				// above, which any signed-in client can reach. A level below MFA
				// is not an error — the declarant journey never asks for one — so
				// the sign-in succeeds with the session simply left undated.
				const { acr, authTime } = readAuthenticationClaims(account?.id_token);
				let testSeamGranted = false;
				if (isAdminMfaAcr(acr)) {
					token.adminMfaAt = authTime ?? Math.floor(Date.now() / 1000);
				} else if (grantsTestAdminMfa(await safeRequestHost())) {
					// Dated from the server clock, never from a claim: the level we
					// are standing in for was not returned, so no `auth_time` exists.
					token.adminMfaAt = Math.floor(Date.now() / 1000);
					testSeamGranted = true;
				} else {
					token.adminMfaAt = undefined;
				}

				// Only admin-eligible accounts produce a row: a declarant signing
				// in at a level we never demanded is not a refused MFA. Neither
				// token nor raw claim is logged.
				if (shouldBeAdmin) {
					const requestContext = await safeRequestContext();
					await logAction({
						action: AUDIT_ACTIONS.AUTH_ADMIN_MFA,
						status: "success",
						userId: dbUser.id,
						userEmail: email,
						metadata: {
							acr,
							authTime: token.adminMfaAt ?? null,
							// Present only when the seam granted the passage, so a row
							// never reads as a real second factor that did not happen.
							...(testSeamGranted ? { testSeam: true } : {}),
						},
						ipAddress: requestContext.ipAddress,
						userAgent: requestContext.userAgent,
					});
				}
			}

			// Last, so it never doubles a close the branches above already made:
			// an explicit stop returns from the update branch, and a sign-in has
			// just emptied the field.
			await closeLapsedImpersonation(token, new Date());

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
				impersonation: exposedImpersonation(token, new Date()),
				adminMfaAt: token.adminMfaAt ?? null,
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
