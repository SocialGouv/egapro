"use client";

import { useSession } from "next-auth/react";

/**
 * Returns `true` while an admin is currently impersonating a company
 * ("mimoquage"). During impersonation every write action must be disabled
 * client-side — the server-side guard (`assertNotImpersonating`) is the real
 * source of truth (issue #3230).
 */
export function useIsImpersonating(): boolean {
	const session = useSession();
	return Boolean(session.data?.user.impersonation);
}

export const IMPERSONATION_READ_ONLY_TOOLTIP =
	"Action désactivée en mode mimoquage (lecture seule).";
