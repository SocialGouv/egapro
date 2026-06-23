import { AUDIT_ACTIONS } from "~/modules/audit";
import { getCurrentYear, parseSiren } from "~/modules/domain";
import { activeDeclarationFilter } from "~/server/api/routers/declarationHelpers";
import { cachedAuth } from "~/server/audit/cachedAuth";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";
import { declarations } from "~/server/db/schema";
import { releaseLock } from "~/server/services/declarationLockService";

async function resolveCurrentDeclarationId(
	siren: string,
): Promise<string | null> {
	const [row] = await db
		.select({ id: declarations.id })
		.from(declarations)
		.where(activeDeclarationFilter(siren, getCurrentYear()))
		.limit(1);

	return row?.id ?? null;
}

/**
 * POST /api/declaration-lock/release
 *
 * Best-effort lock release for `navigator.sendBeacon`, fired by the parcours
 * when the tab is hidden or closed — a context where a tRPC mutation cannot be
 * guaranteed to flush. The declaration is resolved server-side from the
 * session SIREN (never trusting the beacon body), and the lock is only deleted
 * when held by the caller, so a co-declarant viewer can never release another
 * user's lock.
 */
export const POST = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.DECLARATION_LOCK_RELEASED,
		resolveContext: async (request) => {
			const session = await cachedAuth(request);
			return {
				userId: session?.user?.id ?? null,
				userEmail: session?.user?.email ?? null,
				siren: session?.user?.siret ? parseSiren(session.user.siret) : null,
				resourceType: "declaration",
			};
		},
	},
	async (request) => {
		const session = await cachedAuth(request);
		if (!session?.user) {
			return new Response(null, { status: 401 });
		}

		// Impersonating admins never hold an editor lock — nothing to release.
		if (session.user.impersonation) {
			return new Response(null, { status: 204 });
		}

		const siren = session.user.siret ? parseSiren(session.user.siret) : null;
		if (!siren) {
			return new Response(null, { status: 400 });
		}

		const declarationId = await resolveCurrentDeclarationId(siren);
		if (!declarationId) {
			return new Response(null, { status: 204 });
		}

		await releaseLock(db, declarationId, session.user.id);
		return new Response(null, { status: 204 });
	},
);
