import "server-only";

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
 * l'exact opposé délibéré d'`activeDeclarationFilter`. Volontairement privé :
 * la propriété de sûreté repose sur le résolveur ci-dessous, pas sur le filtre,
 * et un second appelant du filtre seul rouvrirait la divergence.
 */
function currentDeclarationFilter(siren: string, year: number) {
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
 * pas seulement leur filtre.
 *
 * L'ordre doit être **total**, sinon il ne décide rien dans les cas où il est
 * justement sollicité : la déclaration active gagne, puis la plus récente, puis
 * l'`id` — clé finale unique, sans laquelle deux lignes annulées de même
 * `createdAt` laisseraient le choix à Postgres. `createdAt` est nullable, et un
 * `DESC` place les NULL en tête : `nulls last` renvoie les lignes sans date au
 * fond, là où « la plus récente » les attend.
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
			sql`${declarations.createdAt} desc nulls last`,
			desc(declarations.id),
		)
		.limit(1);
	return rows[0]?.id ?? null;
}
