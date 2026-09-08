import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";

import type { DB } from "./index";
import { declarations } from "./schema";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type DbOrTx = DB | Tx;

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

/**
 * Le couple (siren, année), **sans** exclure les déclarations annulées —
 * l'exact opposé délibéré d'`activeDeclarationFilter`. C'est ce que le pipeline
 * d'upload écrit, donc ce que son garde de verrou doit inspecter.
 */
export function currentDeclarationFilter(siren: string, year: number) {
	return and(eq(declarations.siren, siren), eq(declarations.year, year));
}

/**
 * La ligne que `/api/upload` écrit réellement, résolue de façon déterministe.
 *
 * L'index unique sur (siren, année) est **partiel** — `WHERE cancelled_at IS
 * NULL` —, donc plusieurs déclarations annulées peuvent partager le couple, et
 * un `LIMIT 1` sans ordre rendrait une ligne arbitraire. Deux requêtes non
 * ordonnées portant le même filtre peuvent rendre deux lignes différentes : le
 * garde de verrou et l'écriture qu'il protège doivent partager ce résolveur,
 * pas seulement leur filtre. L'ordre fait gagner la déclaration active, puis la
 * plus récente.
 */
export async function resolveCurrentDeclarationId(
	db: DbOrTx,
	siren: string,
	year: number,
): Promise<string | null> {
	const rows = await db
		.select({ id: declarations.id })
		.from(declarations)
		.where(currentDeclarationFilter(siren, year))
		.orderBy(
			sql`${declarations.cancelledAt} is null desc`,
			desc(declarations.createdAt),
		)
		.limit(1);
	return rows[0]?.id ?? null;
}
