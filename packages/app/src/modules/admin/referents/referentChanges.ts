import {
	COUNTIES,
	type CountyCode,
	REGIONS,
	type RegionCode,
} from "~/modules/domain";

import type { ReferentFormValues } from "./schemas";
import type { ReferentSearchRow } from "./types";

type ReferentField = keyof ReferentFormValues;

export type ReferentChange = {
	field: ReferentField;
	label: string;
	previous: string;
	next: string;
};

type StoredReferent = Pick<
	ReferentSearchRow,
	| "region"
	| "county"
	| "name"
	| "type"
	| "value"
	| "principal"
	| "substituteName"
	| "substituteEmail"
>;

const EMPTY_VALUE = "—";

const FIELD_LABELS: Record<ReferentField, string> = {
	principal: "Principal",
	name: "Nom",
	region: "Région",
	county: "Département",
	type: "Type de la valeur",
	value: "Valeur",
	substituteName: "Nom du suppléant",
	substituteEmail: "Email du suppléant",
};

const FIELD_ORDER: readonly ReferentField[] = [
	"principal",
	"name",
	"region",
	"county",
	"type",
	"value",
	"substituteName",
	"substituteEmail",
];

function optionalText(value: string | null | undefined): string {
	return value?.trim() ?? "";
}

function regionLabel(code: string): string {
	if (!code) return EMPTY_VALUE;
	return `${REGIONS[code as RegionCode] ?? code} (${code})`;
}

function countyLabel(code: string): string {
	if (!code) return EMPTY_VALUE;
	return `${COUNTIES[code as CountyCode] ?? code} (${code})`;
}

function displayValue(field: ReferentField, raw: string): string {
	if (field === "principal") return raw === "true" ? "Oui" : "Non";
	if (field === "type") return raw === "url" ? "URL" : "Email";
	if (field === "region") return regionLabel(raw);
	if (field === "county") return countyLabel(raw);
	return raw === "" ? EMPTY_VALUE : raw;
}

function toComparable(
	referent: StoredReferent | ReferentFormValues,
): Record<ReferentField, string> {
	return {
		principal: String(referent.principal),
		name: referent.name,
		region: referent.region,
		county: optionalText(referent.county),
		type: referent.type,
		value: referent.value,
		substituteName: optionalText(referent.substituteName),
		substituteEmail: optionalText(referent.substituteEmail),
	};
}

// Compared the way the router stores them: optional texts trimmed, empty meaning absent.
export function listReferentChanges(
	stored: StoredReferent,
	edited: ReferentFormValues,
): ReferentChange[] {
	const before = toComparable(stored);
	const after = toComparable(edited);
	return FIELD_ORDER.filter((field) => before[field] !== after[field]).map(
		(field) => ({
			field,
			label: FIELD_LABELS[field],
			previous: displayValue(field, before[field]),
			next: displayValue(field, after[field]),
		}),
	);
}
