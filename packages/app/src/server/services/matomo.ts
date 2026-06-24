import "server-only";

import { env } from "~/env";
import {
	type MatomoEventRow,
	matomoReportingResponseSchema,
} from "~/modules/admin/stats/schemas";
import type {
	CategoryModelUsage,
	CseStatusConfirmations,
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

	// Step counts come from the event NAME report scoped by a segment: Matomo
	// does not reliably archive the action→name subtable that
	// `Events.getNameFromActionId` would need. The segment is visit-scoped, but
	// `buildFunnelRows` only reads the `step_<n>` keys, so any name leaked from a
	// co-occurring event in the same visit is ignored.
	const stepNames = await callReportingApi(
		config,
		"Events.getName",
		year,
		`${segment};eventCategory==${def.category};eventAction==${MATOMO_FUNNEL_ACTION.STEP_COMPLETE}`,
	);
	for (const row of stepNames) {
		counts[row.label] = toCount(row.nb_events);
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

/**
 * Names recorded for a (category, action) pair, read via a segment on
 * `Events.getName`. Matomo does not reliably archive the action→name subtable
 * that `Events.getNameFromActionId` needs, so we segment instead. The segment is
 * visit-scoped (a co-occurring event in the same visit can leak its own name),
 * so callers MUST map or allow-list the result to the keys they expect.
 */
async function getEventNames(
	config: MatomoConfig,
	category: string,
	action: string,
	year: number,
): Promise<MatomoEventRow[]> {
	return callReportingApi(
		config,
		"Events.getName",
		year,
		`eventCategory==${category};eventAction==${action}`,
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

	// Allow-list the known error types: the segment is visit-scoped, so a name
	// leaked from a co-occurring event is dropped (it never collides with these
	// enum values).
	const failureNames = await getEventNames(
		config,
		MATOMO_EVENT_CATEGORY.DOCUMENT,
		MATOMO_ACTION.CATEGORY_IMPORT_FAILURE,
		year,
	);
	for (const name of failureNames) {
		const label = IMPORT_ERROR_LABELS[name.label];
		if (!label) continue;
		rows.push({
			key: `failure_${name.label}`,
			label: `Échec import — ${label}`,
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
	// Allow-list the known help slugs: the segment is visit-scoped, so any name
	// leaked from a co-occurring event in the same visit is dropped.
	const names = await getEventNames(
		config,
		MATOMO_EVENT_CATEGORY.HELP,
		MATOMO_ACTION.HELP_LINK_CLICK,
		year,
	);
	const rows = names
		.flatMap((name) => {
			const label = HELP_LINK_LABELS[name.label];
			return label
				? [{ key: name.label, label, count: toCount(name.nb_events) }]
				: [];
		})
		.sort((a, b) => b.count - a.count);
	return { rows };
}

/**
 * Volume of CSE-status confirmations for one year, split by the bounded oui/non
 * label. Mirrors {@link fetchHelpLinkClicks}: `Events.getName` is visit-scoped,
 * so the result is **allow-listed** to the two expected labels — a co-occurring
 * event name in the same visit is dropped. Counts confirmation *actions* (a
 * re-save or a second co-declarant counts again); Matomo carries no SIREN, so
 * it cannot dedupe to distinct companies.
 */
async function fetchCseStatusConfirmationsData(
	config: MatomoConfig,
	year: number,
): Promise<CseStatusConfirmations> {
	const names = await getEventNames(
		config,
		MATOMO_EVENT_CATEGORY.CSE_STATUS,
		MATOMO_ACTION.CSE_STATUS_CONFIRM,
		year,
	);
	let yes = 0;
	let no = 0;
	for (const name of names) {
		if (name.label === "oui") yes += toCount(name.nb_events);
		else if (name.label === "non") no += toCount(name.nb_events);
	}
	return { total: yes + no, yes, no };
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

/** Volume of CSE-status confirmations for one year, split oui / non. */
export async function fetchMatomoCseStatusConfirmations({
	year,
}: {
	year: number;
	sizeRange?: CompanySizeRange;
}): Promise<CseStatusConfirmations> {
	const config = readConfig();
	if (!config) return { total: 0, yes: 0, no: 0 };
	return fetchCseStatusConfirmationsData(config, year);
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
