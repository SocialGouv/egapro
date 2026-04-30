import type {
	GipQuartileData,
	QuartileData,
	QuartileTuple,
} from "~/modules/declaration-remuneration";
import { computeQuartileMin, displayDecimal } from "~/modules/domain";

export function toQuartileData(c: {
	womenValue?: string | null;
	womenCount: number;
	menCount: number;
}): QuartileData {
	return {
		threshold: c.womenValue ?? undefined,
		women: c.womenCount,
		men: c.menCount,
	};
}

/** Q4 carries no upper threshold by spec — strip whatever the form holds. */
export function normalizeForMutation(values: {
	annual: QuartileTuple;
	hourly: QuartileTuple;
}): { annual: QuartileTuple; hourly: QuartileTuple } {
	const stripQ4 = (table: QuartileTuple): QuartileTuple => [
		table[0],
		table[1],
		table[2],
		{ ...table[3], threshold: undefined },
	];
	return { annual: stripQ4(values.annual), hourly: stripQ4(values.hourly) };
}

export function gipToQuartiles(gip: GipQuartileData): QuartileData[] {
	return [0, 1, 2, 3].map((i) => ({
		threshold: gip.thresholds[i] ?? undefined,
		women: gip.womenCounts[i] ?? undefined,
		men: gip.menCounts[i] ?? undefined,
	}));
}

export function emptyQuartiles(): QuartileTuple {
	return [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
	];
}

export function computeMinsForTable(
	quartiles: QuartileTuple,
): [string, string, string, string] {
	const dash = "- €";
	const min = (prevThreshold: string | undefined): string => {
		const computed = computeQuartileMin(prevThreshold);
		return computed ? `${displayDecimal(computed)} €` : dash;
	};
	return [
		dash,
		min(quartiles[0]?.threshold),
		min(quartiles[1]?.threshold),
		min(quartiles[2]?.threshold),
	];
}
