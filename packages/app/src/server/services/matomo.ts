import "server-only";

import { env } from "~/env";
import type {
	FunnelRow,
	MatomoFunnelOutput,
} from "~/modules/admin/stats/types";
import {
	MATOMO_EVENT_CATEGORY,
	MATOMO_FUNNEL_ACTION,
} from "~/modules/analytics/shared/events";
import type { CompanySizeRange } from "~/modules/domain";

const ONE_HOUR = 3_600;

type Jalon =
	| { key: string; label: string; kind: "start" | "complete" }
	| { key: string; label: string; kind: "step"; step: string };

type FunnelDef = {
	category: string;
	// Only the declaration funnel carries the workforce dimension (slot 2); the
	// others emit the campaign-year dimension only, so `sizeRange` is ignored.
	segmentByWorkforce: boolean;
	jalons: Jalon[];
};

// Jalons mirror the taxonomy of `docs/plan-de-tracking.md`: entry
// (`funnel_start`) → each forward transition (`step_complete` named after the
// step left) → finalisation (`funnel_complete`).
const FUNNELS: Record<keyof MatomoFunnelOutput, FunnelDef> = {
	declarationFunnel: {
		category: MATOMO_EVENT_CATEGORY.DECLARATION,
		segmentByWorkforce: true,
		jalons: [
			{ key: "start", label: "Démarrage", kind: "start" },
			{
				key: "step_1",
				label: "Étape 1 — Effectifs",
				kind: "step",
				step: "step_1",
			},
			{
				key: "step_2",
				label: "Étape 2 — Écart rémunération",
				kind: "step",
				step: "step_2",
			},
			{
				key: "step_3",
				label: "Étape 3 — Écart variable",
				kind: "step",
				step: "step_3",
			},
			{
				key: "step_4",
				label: "Étape 4 — Quartiles",
				kind: "step",
				step: "step_4",
			},
			{
				key: "step_5",
				label: "Étape 5 — Écart catégorie",
				kind: "step",
				step: "step_5",
			},
			{ key: "complete", label: "Finalisation", kind: "complete" },
		],
	},
	cseFunnel: {
		category: MATOMO_EVENT_CATEGORY.CSE_OPINION,
		segmentByWorkforce: false,
		jalons: [
			{ key: "start", label: "Démarrage", kind: "start" },
			{
				key: "step_1",
				label: "Étape 1 — Avis du CSE",
				kind: "step",
				step: "step_1",
			},
			{ key: "complete", label: "Dépôt de l'avis", kind: "complete" },
		],
	},
	complianceFunnel: {
		category: MATOMO_EVENT_CATEGORY.COMPLIANCE_PATH,
		segmentByWorkforce: false,
		jalons: [
			{ key: "start", label: "Démarrage", kind: "start" },
			{
				key: "step_1",
				label: "Étape 1 — Actions correctives",
				kind: "step",
				step: "step_1",
			},
			{
				key: "step_2",
				label: "Étape 2 — Seconde déclaration",
				kind: "step",
				step: "step_2",
			},
			{ key: "complete", label: "Récapitulatif", kind: "complete" },
		],
	},
};

type MatomoEventRow = {
	label: string;
	nb_events?: number;
	idsubdatatable?: number | string;
};

function countKey(jalon: Jalon): string {
	return jalon.kind === "step" ? jalon.step : jalon.kind;
}

/** Same rounding as the DB completion funnel so both render identically. */
export function buildFunnelRows(
	jalons: Jalon[],
	counts: Record<string, number>,
): FunnelRow[] {
	const numbers = jalons.map((jalon) => counts[countKey(jalon)] ?? 0);
	const start = numbers[0] ?? 0;
	return jalons.map((jalon, index) => {
		const count = numbers[index] ?? 0;
		const pctOfStart = start === 0 ? 0 : Math.round((count / start) * 100);
		let pctDropFromPrev: number | null = null;
		if (index > 0) {
			const prev = numbers[index - 1] ?? 0;
			pctDropFromPrev =
				prev === 0 ? 0 : Math.round(((prev - count) / prev) * 100);
		}
		return {
			key: jalon.key,
			label: jalon.label,
			count,
			pctOfStart,
			pctDropFromPrev,
		};
	});
}

function emptyOutput(): MatomoFunnelOutput {
	return {
		declarationFunnel: buildFunnelRows(FUNNELS.declarationFunnel.jalons, {}),
		cseFunnel: buildFunnelRows(FUNNELS.cseFunnel.jalons, {}),
		complianceFunnel: buildFunnelRows(FUNNELS.complianceFunnel.jalons, {}),
	};
}

type MatomoConfig = { baseUrl: string; siteId: string; token: string };

function readConfig(): MatomoConfig | null {
	const baseUrl = env.MATOMO_API_URL ?? env.NEXT_PUBLIC_MATOMO_URL;
	const siteId = env.NEXT_PUBLIC_MATOMO_SITE_ID;
	const token = env.MATOMO_API_TOKEN;
	if (!baseUrl || !siteId || !token) return null;
	return { baseUrl: baseUrl.replace(/\/$/, ""), siteId, token };
}

function buildSegment(year: number, sizeRange?: CompanySizeRange): string {
	const parts = [`dimension1==${year}`];
	if (sizeRange) parts.push(`dimension2==${sizeRange}`);
	return parts.join(";");
}

async function callReportingApi(
	config: MatomoConfig,
	method: string,
	year: number,
	segment: string,
	idSubtable?: number | string,
): Promise<MatomoEventRow[]> {
	const body = new URLSearchParams({
		module: "API",
		method,
		idSite: config.siteId,
		period: "year",
		date: `${year}-12-31`,
		format: "JSON",
		filter_limit: "-1",
		segment,
		// token_auth in the POST body — never the URL (it would land in logs).
		token_auth: config.token,
	});
	if (idSubtable !== undefined) body.set("idSubtable", String(idSubtable));

	const response = await fetch(`${config.baseUrl}/index.php`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
		},
		body,
		signal: AbortSignal.timeout(10_000),
		next: { revalidate: ONE_HOUR },
	});

	if (!response.ok) {
		throw new Error(
			`Matomo Reporting API error: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as
		| MatomoEventRow[]
		| { result?: string; message?: string };
	if (!Array.isArray(data)) {
		throw new Error(
			`Matomo Reporting API error: ${data.message ?? "unexpected response"}`,
		);
	}
	return data;
}

function toCount(value: number | undefined): number {
	return typeof value === "number" ? value : 0;
}

async function fetchFunnel(
	config: MatomoConfig,
	def: FunnelDef,
	year: number,
	sizeRange: CompanySizeRange | undefined,
): Promise<FunnelRow[]> {
	const segment = buildSegment(
		year,
		def.segmentByWorkforce ? sizeRange : undefined,
	);

	const categories = await callReportingApi(
		config,
		"Events.getCategory",
		year,
		segment,
	);
	const categoryRow = categories.find((row) => row.label === def.category);
	if (categoryRow?.idsubdatatable === undefined) {
		return buildFunnelRows(def.jalons, {});
	}

	const actions = await callReportingApi(
		config,
		"Events.getActionFromCategoryId",
		year,
		segment,
		categoryRow.idsubdatatable,
	);

	const counts: Record<string, number> = {
		start: toCount(
			actions.find((row) => row.label === MATOMO_FUNNEL_ACTION.FUNNEL_START)
				?.nb_events,
		),
		complete: toCount(
			actions.find((row) => row.label === MATOMO_FUNNEL_ACTION.FUNNEL_COMPLETE)
				?.nb_events,
		),
	};

	const stepAction = actions.find(
		(row) => row.label === MATOMO_FUNNEL_ACTION.STEP_COMPLETE,
	);
	if (stepAction?.idsubdatatable !== undefined) {
		const names = await callReportingApi(
			config,
			"Events.getNameFromActionId",
			year,
			segment,
			stepAction.idsubdatatable,
		);
		for (const row of names) {
			counts[row.label] = toCount(row.nb_events);
		}
	}

	return buildFunnelRows(def.jalons, counts);
}

/**
 * Reads the three client-side funnels from the Matomo Reporting API for one
 * campaign year. Degrades to empty (all-zero) funnels when Matomo is not
 * configured (`MATOMO_API_TOKEN` absent) — dev / review apps simply show "no
 * data" instead of failing.
 */
export async function fetchMatomoFunnel({
	year,
	sizeRange,
}: {
	year: number;
	sizeRange?: CompanySizeRange;
}): Promise<MatomoFunnelOutput> {
	const config = readConfig();
	if (!config) return emptyOutput();

	const [declarationFunnel, cseFunnel, complianceFunnel] = await Promise.all([
		fetchFunnel(config, FUNNELS.declarationFunnel, year, sizeRange),
		fetchFunnel(config, FUNNELS.cseFunnel, year, sizeRange),
		fetchFunnel(config, FUNNELS.complianceFunnel, year, sizeRange),
	]);

	return { declarationFunnel, cseFunnel, complianceFunnel };
}
