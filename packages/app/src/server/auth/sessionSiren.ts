import "server-only";

import type { Session } from "next-auth";

import { cachedAuth } from "~/server/audit/cachedAuth";
import { db } from "~/server/db";
import { resolveAuthorizedSiren } from "./companyAccess";

export type SessionSiren = {
	session: Session | null;
	siren: string | null;
};

export async function getSessionSiren(request: Request): Promise<SessionSiren> {
	const session = await cachedAuth(request);
	return { session, siren: await resolveAuthorizedSiren(db, session) };
}
