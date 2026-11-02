import { AUDIT_ACTIONS } from "~/modules/audit";
import { getRepresentationDeclarationSchema } from "~/modules/declaration-representation/schemas";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { getSessionSiren } from "~/server/auth/sessionSiren";
import { db } from "~/server/db";
import { releaseRepresentationLock } from "~/server/services/representationDeclarationLockService";

export const POST = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.DECLARATION_LOCK_RELEASED,
		resolveContext: async (request) => {
			const { session, siren } = await getSessionSiren(request);
			return {
				userId: session?.user?.id ?? null,
				userEmail: session?.user?.email ?? null,
				siren,
				resourceType: "representation_declaration",
			};
		},
	},
	async (request) => {
		const { session, siren } = await getSessionSiren(request);
		if (!session?.user) return new Response(null, { status: 401 });
		if (session.user.impersonation) return new Response(null, { status: 204 });
		if (!siren) return new Response(null, { status: 400 });

		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return new Response(null, { status: 400 });
		}
		const parsed = getRepresentationDeclarationSchema.safeParse(body);
		if (!parsed.success) return new Response(null, { status: 400 });

		await releaseRepresentationLock(
			db,
			siren,
			parsed.data.year,
			session.user.id,
		);
		return new Response(null, { status: 204 });
	},
);
