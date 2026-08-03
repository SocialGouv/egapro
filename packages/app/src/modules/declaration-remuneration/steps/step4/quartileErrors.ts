import type { QuartileTuple } from "~/modules/declaration-remuneration";
import type { QuartileFieldErrors } from "./QuartileTable";

export type TableType = "annual" | "hourly";
export type CountField = "women" | "men";

export const TABLE_LABEL: Record<TableType, string> = {
	annual: "rémunération annuelle",
	hourly: "rémunération horaire",
};

export type FieldErrorMap = Record<
	TableType,
	[
		QuartileFieldErrors,
		QuartileFieldErrors,
		QuartileFieldErrors,
		QuartileFieldErrors,
	]
>;

export type RecapEntry = {
	id: string;
	label: string;
};

function createEmptyError(): QuartileFieldErrors {
	return {};
}

export function emptyErrorMap(): FieldErrorMap {
	return {
		annual: [
			createEmptyError(),
			createEmptyError(),
			createEmptyError(),
			createEmptyError(),
		],
		hourly: [
			createEmptyError(),
			createEmptyError(),
			createEmptyError(),
			createEmptyError(),
		],
	};
}

export function fieldId(
	tableType: TableType,
	index: number,
	suffix: "max" | "f" | "h",
) {
	return `step4-${tableType}-q${index + 1}-${suffix}`;
}

const SUFFIX_FOR_FIELD: Record<"threshold" | CountField, "max" | "f" | "h"> = {
	threshold: "max",
	women: "f",
	men: "h",
};

function isValidThreshold(v: string | undefined): boolean {
	return v !== undefined && v !== "" && !Number.isNaN(Number(v));
}

/** Returns the index of the first threshold that breaks strict ascending order, or null. */
export function findCroissanceOffender(
	thresholds: Array<string | undefined>,
): number | null {
	const [t1, t2, t3] = thresholds
		.slice(0, 3)
		.map((t) => Number.parseFloat(t ?? "")) as [number, number, number];
	if ([t1, t2, t3].some((n) => Number.isNaN(n))) return null;
	if (!(t1 < t2)) return 1;
	if (!(t2 < t3)) return 2;
	return null;
}

export function deriveErrors(values: {
	annual: QuartileTuple;
	hourly: QuartileTuple;
}): FieldErrorMap {
	const result = emptyErrorMap();
	for (const table of ["annual", "hourly"] as const) {
		const tableValues = values[table];
		// Required check on Q1/Q2/Q3 thresholds
		for (let i = 0; i < 3; i++) {
			const cell = tableValues[i];
			if (!isValidThreshold(cell?.threshold)) {
				result[table][i] = {
					...result[table][i],
					threshold: "Le seuil est obligatoire",
				};
			}
		}
		// Strictly increasing check (only when all 3 are valid)
		const t1 = tableValues[0]?.threshold;
		const t2 = tableValues[1]?.threshold;
		const t3 = tableValues[2]?.threshold;
		if (isValidThreshold(t1) && isValidThreshold(t2) && isValidThreshold(t3)) {
			const offender = findCroissanceOffender([t1, t2, t3]);
			if (offender !== null) {
				result[table][offender] = {
					...result[table][offender],
					threshold: "Les seuils doivent être strictement croissants",
				};
			}
		}
		// Counts required (8 cells per table)
		for (let i = 0; i < 4; i++) {
			const cell = tableValues[i];
			if (cell?.women === undefined) {
				result[table][i] = {
					...result[table][i],
					women: "Effectif obligatoire",
				};
			}
			if (cell?.men === undefined) {
				result[table][i] = {
					...result[table][i],
					men: "Effectif obligatoire",
				};
			}
		}
	}
	return result;
}

export function hasAnyError(map: FieldErrorMap): boolean {
	for (const table of ["annual", "hourly"] as const) {
		for (let i = 0; i < 4; i++) {
			const cell = map[table][i] ?? createEmptyError();
			if (cell.threshold || cell.women || cell.men) return true;
		}
	}
	return false;
}

/** Builds up to 4 anchor entries for the recap alert (RGAA 11.10/11.13). */
export function buildRecap(errors: FieldErrorMap): RecapEntry[] {
	const out: RecapEntry[] = [];
	const orderedFields: Array<"threshold" | CountField> = [
		"threshold",
		"women",
		"men",
	];
	for (const table of ["annual", "hourly"] as const) {
		for (let i = 0; i < 4; i++) {
			const cell = errors[table][i] ?? createEmptyError();
			for (const field of orderedFields) {
				const message = cell[field];
				if (!message) continue;
				const id = fieldId(table, i, SUFFIX_FOR_FIELD[field]);
				const fieldLabel =
					field === "threshold"
						? "Seuil"
						: field === "women"
							? "Effectif femmes"
							: "Effectif hommes";
				const ordinal = `${i + 1}${i === 0 ? "er" : "e"}`;
				out.push({
					id,
					label: `${fieldLabel} ${ordinal} quartile (${TABLE_LABEL[table]}) — ${message}`,
				});
				if (out.length === 4) return out;
			}
		}
	}
	return out;
}
