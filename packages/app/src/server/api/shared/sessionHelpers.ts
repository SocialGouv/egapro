import { TRPCError } from "@trpc/server";

/**
 * Extract the 9-digit SIREN from a 14-digit SIRET.
 * Throws a TRPCError if SIRET is missing from the session.
 */
export function getSiren(siret: string | null | undefined): string {
	if (!siret) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "SIRET manquant dans la session",
		});
	}
	return siret.slice(0, 9);
}

/**
 * CSE opinions apply to the following year (N+1).
 */
export function getCseYear(): number {
	return new Date().getFullYear() + 1;
}
