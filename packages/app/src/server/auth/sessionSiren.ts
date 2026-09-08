import "server-only";

import type { Session } from "next-auth";

import { parseSiren } from "~/modules/domain";
import { cachedAuth } from "~/server/audit/cachedAuth";
import { getEffectiveSiren } from "./companyAccess";

export type SessionSiren = {
	session: Session | null;
	siren: string | null;
};

// Impersonation-aware and validating like `companyProcedure`: a malformed SIRET yields `null`, never a nine-character lookalike.
export async function getSessionSiren(request: Request): Promise<SessionSiren> {
	const session = await cachedAuth(request);
	return { session, siren: parseSiren(getEffectiveSiren(session)) };
}
