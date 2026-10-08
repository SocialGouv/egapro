import { TRPCError } from "@trpc/server";

export const REFERENT_LOOKUP_RATE_LIMITED = "rate_limited";

// A malformed id reads as « introuvable », a quota hit must not.
export function toReferentLookupFailure(
	error: unknown,
): null | typeof REFERENT_LOOKUP_RATE_LIMITED {
	if (error instanceof TRPCError) {
		if (error.code === "TOO_MANY_REQUESTS") return REFERENT_LOOKUP_RATE_LIMITED;
		if (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST") return null;
	}
	throw error;
}
