import "server-only";

import { env } from "~/env";
import {
	type MatomoEventRow,
	matomoReportingResponseSchema,
} from "~/modules/admin/stats/schemas";
import type {
	CategoryModelUsage,
	DeviceBreakdown,
	DeviceBreakdownRow,
	FunnelRow,
	HelpLinkClicks,
	LabeledCount,
	MatomoFunnelOutput,
} from "~/modules/admin/stats/types";
import {
	MATOMO_ACTION,
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

	// Validate the external response at the boundary rather than trusting an
	// `as` cast. An unexpected shape degrades to no rows (empty funnel); a
	// well-formed Matomo error object is surfaced.
	const parsed = matomoReportingResponseSchema.safeParse(await response.json());
	if (!parsed.success) return [];
	if (!Array.isArray(parsed.data)) {
		throw new Error(
			`Matomo Reporting API error: ${parsed.data.message ?? "unexpected response"}`,
		);
	}
	return parsed.data;
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

// ---------------------------------------------------------------------------
// Behavioural-usage widgets (model usage, help-link clicks, device split).
//
// The `document` / `help` events carry no custom dimension (only the funnels
// segment by campaign year / workforce), so these reads scope by calendar year
// via `period=year` + `date=${year}-12-31` and use an empty segment. They are
// therefore not segmented by workforce — `sizeRange` is accepted for a uniform
// API but intentionally unused here.
// ---------------------------------------------------------------------------

const IMPORT_ERROR_LABELS: Record<string, string> = {
	"missing-columns": "colonnes manquantes",
	"invalid-value": "valeur invalide",
	"empty-file": "fichier vide",
};

const HELP_LINK_LABELS: Record<string, string> = {
	cse_models: "Modèles d'avis CSE",
	objective_criteria: "Critères objectifs et non sexistes",
	corrective_actions: "Actions correctives et seconde déclaration",
	joint_evaluation: "Évaluation conjointe des rémunérations",
};

function toAvgSeconds(value: number | string | undefined): number | null {
	if (value === undefined) return null;
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/** Resolve a Matomo category subtable id for `Events.getActionFromCategoryId`. */
async function getCategoryActions(
	config: MatomoConfig,
	category: string,
	year: number,
): Promise<MatomoEventRow[]> {
	const categories = await callReportingApi(
		config,
		"Events.getCategory",
		year,
		"",
	);
	const categoryRow = categories.find((row) => row.label === category);
	if (categoryRow?.idsubdatatable === undefined) return [];
	return callReportingApi(
		config,
		"Events.getActionFromCategoryId",
		year,
		"",
		categoryRow.idsubdatatable,
	);
}

/** Drill into the `name` subtable of one action (e.g. format, error type). */
async function getActionNames(
	config: MatomoConfig,
	action: MatomoEventRow | undefined,
	year: number,
): Promise<MatomoEventRow[]> {
	if (action?.idsubdatatable === undefined) return [];
	return callReportingApi(
		config,
		"Events.getNameFromActionId",
		year,
		"",
		action.idsubdatatable,
	);
}

async function fetchCategoryModelUsage(
	config: MatomoConfig,
	year: number,
): Promise<CategoryModelUsage> {
	const actions = await getCategoryActions(
		config,
		MATOMO_EVENT_CATEGORY.DOCUMENT,
		year,
	);
	const rows: LabeledCount[] = [];

	const importAction = actions.find(
		(row) => row.label === MATOMO_ACTION.CATEGORY_IMPORT,
	);
	if (importAction) {
		rows.push({
			key: "import",
			label: "Imports réussis",
			count: toCount(importAction.nb_events),
		});
	}

	const failureAction = actions.find(
		(row) => row.label === MATOMO_ACTION.CATEGORY_IMPORT_FAILURE,
	);
	const failureNames = await getActionNames(config, failureAction, year);
	for (const name of failureNames) {
		rows.push({
			key: `failure_${name.label}`,
			label: `Échec import — ${IMPORT_ERROR_LABELS[name.label] ?? name.label}`,
			count: toCount(name.nb_events),
		});
	}

	const durationAction = actions.find(
		(row) => row.label === MATOMO_ACTION.CATEGORY_IMPORT_DURATION,
	);

	return {
		rows,
		avgImportDurationSeconds: toAvgSeconds(durationAction?.avg_event_value),
	};
}

async function fetchHelpLinkClicks(
	config: MatomoConfig,
	year: number,
): Promise<HelpLinkClicks> {
	const actions = await getCategoryActions(
		config,
		MATOMO_EVENT_CATEGORY.HELP,
		year,
	);
	const clickAction = actions.find(
		(row) => row.label === MATOMO_ACTION.HELP_LINK_CLICK,
	);
	const names = await getActionNames(config, clickAction, year);
	const rows = names
		.map((name) => ({
			key: name.label,
			label: HELP_LINK_LABELS[name.label] ?? name.label,
			count: toCount(name.nb_events),
		}))
		.sort((a, b) => b.count - a.count);
	return { rows };
}

// Each behaviour is detected by its marker event. `DevicesDetection.getType`
// returns device-type rows (`nb_visits`) for visits matching the segment.
// ⚠️ Segment dimension names and `DevicesDetection.getType` must be validated
// against the real Matomo instance — in dev (no token) the widget degrades to
// empty rows.
const DEVICE_BEHAVIORS = [
	{
		key: "modification",
		label: "Modification (déclaration)",
		segment: `eventCategory==${MATOMO_EVENT_CATEGORY.DECLARATION};eventAction==${MATOMO_FUNNEL_ACTION.FUNNEL_COMPLETE}`,
	},
	{
		key: "deposit",
		label: "Dépôt (avis CSE)",
		segment: `eventCategory==${MATOMO_EVENT_CATEGORY.CSE_OPINION};eventAction==${MATOMO_FUNNEL_ACTION.FUNNEL_COMPLETE}`,
	},
	{
		key: "consultation",
		label: "Consultation",
		segment: `eventCategory==${MATOMO_EVENT_CATEGORY.SEARCH};eventAction==${MATOMO_ACTION.CONSULTATION_OUTBOUND}`,
	},
] as const;

function classifyDevice(
	label: string,
): "desktop" | "smartphone" | "tablet" | null {
	const normalized = label.toLowerCase();
	if (normalized.includes("desktop")) return "desktop";
	if (normalized.includes("smartphone") || normalized.includes("phone")) {
		return "smartphone";
	}
	if (normalized.includes("tablet")) return "tablet";
	return null;
}

function emptyDeviceBreakdown(): DeviceBreakdown {
	return {
		rows: DEVICE_BEHAVIORS.map((behavior) => ({
			key: behavior.key,
			label: behavior.label,
			desktop: 0,
			smartphone: 0,
			tablet: 0,
		})),
	};
}

async function fetchDeviceBreakdownRows(
	config: MatomoConfig,
	year: number,
): Promise<DeviceBreakdown> {
	const rows = await Promise.all(
		DEVICE_BEHAVIORS.map(async (behavior): Promise<DeviceBreakdownRow> => {
			const devices = await callReportingApi(
				config,
				"DevicesDetection.getType",
				year,
				behavior.segment,
			);
			const counts = { desktop: 0, smartphone: 0, tablet: 0 };
			for (const device of devices) {
				const type = classifyDevice(device.label);
				if (type) counts[type] += toCount(device.nb_visits);
			}
			return { key: behavior.key, label: behavior.label, ...counts };
		}),
	);
	return { rows };
}

/** Usage of the indicator-by-category model (downloads / imports / failures). */
export async function fetchMatomoCategoryModel({
	year,
}: {
	year: number;
	sizeRange?: CompanySizeRange;
}): Promise<CategoryModelUsage> {
	const config = readConfig();
	if (!config) return { rows: [], avgImportDurationSeconds: null };
	return fetchCategoryModelUsage(config, year);
}

/** Clicks on instrumented help links, by slug, descending. */
export async function fetchMatomoHelpLinks({
	year,
}: {
	year: number;
	sizeRange?: CompanySizeRange;
}): Promise<HelpLinkClicks> {
	const config = readConfig();
	if (!config) return { rows: [] };
	return fetchHelpLinkClicks(config, year);
}

/** Device split (desktop / smartphone / tablet) for the 3 tracked behaviours. */
export async function fetchMatomoDeviceBreakdown({
	year,
}: {
	year: number;
	sizeRange?: CompanySizeRange;
}): Promise<DeviceBreakdown> {
	const config = readConfig();
	if (!config) return emptyDeviceBreakdown();
	return fetchDeviceBreakdownRows(config, year);
}
