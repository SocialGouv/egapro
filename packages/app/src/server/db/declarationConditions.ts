import "server-only";

import { and, desc, eq, inArray, isNull, ne, type SQL, sql } from "drizzle-orm";

import {
	DEMARCHE_LIFECYCLE_STATUSES,
	type DemarcheLifecycleStatus,
	TRANSMISSION_EVENT_TYPES,
	type TransmissionEventType,
} from "~/modules/domain";
import type { DB } from "./index";
import { declarationStatusHistory, declarations } from "./schema";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type DbOrTx = DB | Tx;

/**
 * SQL mirrors of the domain declaration predicates. Drizzle builds SQL and
 * cannot call the isomorphic domain functions (`isDeclarationSubmitted`,
 * `isComplianceProcessCompleted`, `isCancelled`), so these helpers keep the
 * query-layer definition in one place instead of scattering the `"draft"` /
 * `"demarche_completed"` / `cancelledAt` literals across queries.
 * They must stay in sync with `~/modules/domain` — see the parity note in
 * `rules/code-quality.md` § Domain layer.
 */

/** Drizzle condition mirroring `isDeclarationSubmitted`: the declaration has left the draft state. */
export function submittedDeclarationCondition() {
	return ne(declarations.status, "draft");
}

export function complianceProcessCompletedCondition() {
	return eq(declarations.status, "demarche_completed");
}

/** Drizzle condition mirroring `isCancelled` (negated): the declaration is not cancelled. */
export function notCancelledCondition() {
	return isNull(declarations.cancelledAt);
}

// postgres.js hands raw SQL timestamps back as strings: the column type metadata is lost in a subquery or a CASE.
const toDate = (value: unknown): Date | null =>
	value == null ? null : new Date(value as string | number | Date);

/** SQL mirror of `getDemarcheLifecycleStatus`: one CASE whose branches follow the domain order (cancellation first). */
function demarcheLifecycleCase(
	branches: Record<DemarcheLifecycleStatus, SQL>,
): SQL {
	return sql`CASE
		WHEN NOT (${notCancelledCondition()}) THEN ${branches.cancelled}
		WHEN NOT (${submittedDeclarationCondition()}) THEN ${branches.draft}
		WHEN ${complianceProcessCompletedCondition()} THEN ${branches.completed}
		ELSE ${branches.in_progress}
	END`;
}

function statusLiteral(status: DemarcheLifecycleStatus): SQL {
	return sql.raw(`'${status}'`);
}

function statusRank(status: DemarcheLifecycleStatus): SQL {
	return sql.raw(String(DEMARCHE_LIFECYCLE_STATUSES.indexOf(status)));
}

export function demarcheLifecycleStatusCondition(
	status: DemarcheLifecycleStatus,
): SQL {
	return sql`${demarcheLifecycleCase({
		draft: statusLiteral("draft"),
		in_progress: statusLiteral("in_progress"),
		completed: statusLiteral("completed"),
		cancelled: statusLiteral("cancelled"),
	})} = ${status}`;
}

function demarcheLifecycleRank(): SQL {
	return demarcheLifecycleCase({
		draft: statusRank("draft"),
		in_progress: statusRank("in_progress"),
		completed: statusRank("completed"),
		cancelled: statusRank("cancelled"),
	});
}

export function demarcheLifecycleSortKey(sortOrder: "asc" | "desc"): SQL {
	return sortOrder === "asc"
		? sql`${demarcheLifecycleRank()} ASC`
		: sql`${demarcheLifecycleRank()} DESC`;
}

function latestHistoryEventAt(
	eventTypes: ReadonlyArray<TransmissionEventType | "demarche_complete">,
): SQL<Date | null> {
	return sql<Date | null>`(
		SELECT MAX(${declarationStatusHistory.createdAt})
		FROM ${declarationStatusHistory}
		WHERE ${declarationStatusHistory.declarationId} = ${declarations.id}
		AND ${inArray(declarationStatusHistory.eventType, [...eventTypes])}
	)`;
}

export function lastTransmissionAt(): SQL<Date | null> {
	return latestHistoryEventAt(TRANSMISSION_EVENT_TYPES).mapWith(toDate);
}

export function demarcheCompletedAt(): SQL<Date | null> {
	return latestHistoryEventAt(["demarche_complete"]).mapWith(toDate);
}

export type LastTransmissionEvent = {
	eventType: string;
	value: string | null;
};

export function lastTransmissionEvent(): SQL<LastTransmissionEvent | null> {
	return sql<LastTransmissionEvent | null>`(
		SELECT json_build_object(
			'eventType', ${declarationStatusHistory.eventType},
			'value', ${declarationStatusHistory.value}
		)
		FROM ${declarationStatusHistory}
		WHERE ${declarationStatusHistory.declarationId} = ${declarations.id}
		AND ${inArray(declarationStatusHistory.eventType, [...TRANSMISSION_EVENT_TYPES])}
		ORDER BY ${declarationStatusHistory.createdAt} DESC, ${declarationStatusHistory.id} DESC
		LIMIT 1
	)`.mapWith((value: unknown) =>
		value == null ? null : (value as LastTransmissionEvent),
	);
}

/** SQL mirror of `getDemarcheStatusDate`. `cancelled_at` has no time zone: it holds the UTC wall clock Drizzle wrote. */
export function demarcheStatusDate(): SQL<Date | null> {
	return demarcheLifecycleCase({
		draft: sql`${declarations.createdAt}`,
		in_progress: latestHistoryEventAt(TRANSMISSION_EVENT_TYPES),
		completed: latestHistoryEventAt(["demarche_complete"]),
		cancelled: sql`(${declarations.cancelledAt} AT TIME ZONE 'UTC')`,
	}).mapWith(toDate);
}

// NULLS LAST spelled out both ways: Postgres defaults to NULLS FIRST on DESC.
export function demarcheStatusDateSortKey(sortOrder: "asc" | "desc"): SQL {
	return sortOrder === "asc"
		? sql`${demarcheStatusDate()} ASC NULLS LAST`
		: sql`${demarcheStatusDate()} DESC NULLS LAST`;
}

function demarcheStatusParisDay(): SQL {
	return sql`(${demarcheStatusDate()} AT TIME ZONE 'Europe/Paris')::date`;
}

export function demarcheStatusOnOrAfter(civilDate: string): SQL {
	return sql`${demarcheStatusParisDay()} >= ${civilDate}::date`;
}

export function demarcheStatusOnOrBefore(civilDate: string): SQL {
	return sql`${demarcheStatusParisDay()} <= ${civilDate}::date`;
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

function currentDeclarationOrder() {
	return [
		sql`${declarations.cancelledAt} is null desc`,
		sql`${declarations.createdAt} desc nulls last`,
		desc(declarations.id),
	];
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
		.orderBy(...currentDeclarationOrder())
		.limit(1);
	return rows[0]?.id ?? null;
}

export type ExportDeclarationResolution = {
	id: string;
	cancelledAt: Date | null;
};

/**
 * La déclaration exposée aux lecteurs d'export (`/export/declarations`,
 * `/files`) pour un couple (siren, année) : le pendant lecture de
 * `resolveCurrentDeclarationId`, avec le même ordre total, mais qui écarte
 * d'abord les brouillons via `submittedDeclarationCondition`. Un brouillon
 * ouvert après une annulation (redéclaration en cours) ne doit jamais
 * masquer la déclaration transmise qu'il redéclare — parmi les déclarations
 * transmises restantes, l'active gagne, sinon la plus récente annulée.
 *
 * Ne réutilise pas `resolveCurrentDeclarationId` : celle-ci sert le garde de
 * verrou et `uploadPipeline`, dont le comportement en écriture (une
 * déclaration en brouillon reste ciblable) ne doit pas changer.
 */
export async function resolveExportDeclarationId(
	db: DbOrTx,
	siren: string,
	year: number,
): Promise<ExportDeclarationResolution | null> {
	const rows = await db
		.select({ id: declarations.id, cancelledAt: declarations.cancelledAt })
		.from(declarations)
		.where(
			and(
				currentDeclarationFilter(siren, year),
				submittedDeclarationCondition(),
			),
		)
		.orderBy(...currentDeclarationOrder())
		.limit(1);
	return rows[0] ?? null;
}
