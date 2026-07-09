import { isNull, ne } from "drizzle-orm";

import { declarations } from "./schema";

/**
 * SQL mirrors of the domain declaration predicates. Drizzle builds SQL and
 * cannot call the isomorphic domain functions (`isDeclarationSubmitted`,
 * `isCancelled`), so these helpers keep the query-layer definition in one place
 * instead of scattering the `"draft"` / `cancelledAt` literals across queries.
 * They must stay in sync with `~/modules/domain` — see the parity note in
 * `rules/code-quality.md` § Domain layer.
 */

/** Drizzle condition mirroring `isDeclarationSubmitted`: the declaration has left the draft state. */
export function submittedDeclarationCondition() {
	return ne(declarations.status, "draft");
}

/** Drizzle condition mirroring `isCancelled` (negated): the declaration is not cancelled. */
export function notCancelledCondition() {
	return isNull(declarations.cancelledAt);
}
