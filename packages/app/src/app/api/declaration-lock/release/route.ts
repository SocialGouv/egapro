import { AUDIT_ACTIONS } from "~/modules/audit";
import { getCurrentYear } from "~/modules/domain";
import { activeDeclarationFilter } from "~/server/api/routers/declarationHelpers";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
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

// Best-effort lock release for `navigator.sendBeacon` on tab close, where a tRPC
// mutation cannot be guaranteed to flush. The declaration is resolved server-side
// from the session SIREN (never the beacon body) and `releaseLock` only deletes a
// lock held by the caller, closing the IDOR window.
export const POST = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.DECLARATION_LOCK_RELEASED,
		resolveContext: async (request) => {
			const { session, siren } = await getSessionSiren(request);
			return {
				userId: session?.user?.id ?? null,
				userEmail: session?.user?.email ?? null,
				siren,
				resourceType: "declaration",
			};
		},
	},
	async (request) => {
		const { session, siren } = await getSessionSiren(request);
		if (!session?.user) {
			return new Response(null, { status: 401 });
		}

		// Impersonating admins never hold an editor lock — nothing to release.
		if (session.user.impersonation) {
			return new Response(null, { status: 204 });
		}

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
