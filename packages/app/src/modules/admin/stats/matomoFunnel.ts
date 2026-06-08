import {
	MATOMO_CUSTOM_DIMENSION,
	MATOMO_DECLARATION_ACTION,
	MATOMO_EVENT_CATEGORY,
} from "~/modules/analytics/shared/events";
import { type CompanySizeRange, getStepLabel } from "~/modules/domain";
import type { MatomoEventsReportRow } from "~/server/services/matomo";
import type { MatomoFunnelOutput, MatomoFunnelRow } from "./types";

// Campaign year N is declared in early N+1, so the funnel is filtered on the
// CAMPAIGN_YEAR custom dimension, not the event date — the Matomo query spans a
// wide range and lets the segment do the year scoping.
export const MATOMO_FUNNEL_DATE_RANGE = "2020-01-01,today";

export function buildMatomoFunnelSegment({
	year,
	sizeRange,
}: {
	year: number;
	sizeRange?: CompanySizeRange;
}): string {
	const parts = [
		`eventCategory==${MATOMO_EVENT_CATEGORY.DECLARATION}`,
		`dimension${MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR}==${year}`,
	];
	if (sizeRange) {
		parts.push(
			`dimension${MATOMO_CUSTOM_DIMENSION.WORKFORCE_RANGE}==${sizeRange}`,
		);
	}
	return parts.join(";");
}

function parseStepNumber(stepKey: string): number | null {
	const match = /^step_(\d+)$/.exec(stepKey);
	return match?.[1] !== undefined ? Number(match[1]) : null;
}

function countForAction(rows: MatomoEventsReportRow[], action: string): number {
	return rows.find((row) => row.label === action)?.nb_events ?? 0;
}

export function mapMatomoFunnel(
	actionRows: MatomoEventsReportRow[],
	stepRows: MatomoEventsReportRow[],
): MatomoFunnelOutput {
	const steps: MatomoFunnelRow[] = stepRows
		.map((row): (MatomoFunnelRow & { step: number }) | null => {
			const step = parseStepNumber(row.label);
			if (step === null) return null;
			const avg = row.avg_event_value;
			return {
				step,
				stepKey: row.label,
				label: getStepLabel(step),
				completedCount: row.nb_events ?? 0,
				avgDurationSeconds: typeof avg === "number" ? Math.round(avg) : null,
			};
		})
		.filter((row): row is MatomoFunnelRow & { step: number } => row !== null)
		.sort((a, b) => a.step - b.step)
		.map(({ step: _step, ...row }) => row);

	return {
		startedCount: countForAction(
			actionRows,
			MATOMO_DECLARATION_ACTION.FUNNEL_START,
		),
		completedCount: countForAction(
			actionRows,
			MATOMO_DECLARATION_ACTION.FUNNEL_COMPLETE,
		),
		abandonedCount: countForAction(
			actionRows,
			MATOMO_DECLARATION_ACTION.FUNNEL_ABANDON,
		),
		steps,
	};
}
