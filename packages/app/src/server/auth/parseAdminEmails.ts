/**
 * Parse a comma-separated list of admin emails into a normalized set.
 *
 * Normalization:
 * - trims whitespace around each entry
 * - lowercases every address
 * - drops empty entries (handles trailing commas, double commas, whitespace-only)
 *
 * This is the sole source of truth for the `isAdmin` flag in the NextAuth JWT
 * callback, so it is kept pure and heavily tested: a regression here would
 * silently grant or revoke backoffice access.
 */
export function parseAdminEmails(raw: string | undefined | null): Set<string> {
	return new Set(
		(raw ?? "")
			.split(",")
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean),
	);
}
