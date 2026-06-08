import { FUNNEL_DROP_ALERT_THRESHOLD } from "~/modules/domain";

import { CompletionFunnelChart } from "./CompletionFunnelChart";
import type { FunnelRow, MatomoFunnelOutput } from "./types";

export function buildMatomoFunnelRows(data: MatomoFunnelOutput): FunnelRow[] {
	const entries = [
		{ key: "funnel_start", label: "Entrées", count: data.startedCount },
		...data.steps.map((step) => ({
			key: step.stepKey,
			label: step.label,
			count: step.completedCount,
		})),
		{
			key: "funnel_complete",
			label: "Complétions",
			count: data.completedCount,
		},
	];

	const start = data.startedCount;
	let previous: number | null = null;

	return entries.map((entry) => {
		const pctOfStart = start > 0 ? Math.round((entry.count / start) * 100) : 0;
		const pctDropFromPrev =
			previous !== null && previous > 0
				? Math.round(((previous - entry.count) / previous) * 100)
				: null;
		previous = entry.count;
		return {
			key: entry.key,
			label: entry.label,
			count: entry.count,
			pctOfStart,
			pctDropFromPrev,
		};
	});
}

type Props = {
	caption: string;
	data: MatomoFunnelOutput;
};

export function MatomoFunnelChart({ caption, data }: Props) {
	return (
		<CompletionFunnelChart
			caption={caption}
			dropThreshold={FUNNEL_DROP_ALERT_THRESHOLD}
			rows={buildMatomoFunnelRows(data)}
			unitNoun="parcours"
		/>
	);
}
