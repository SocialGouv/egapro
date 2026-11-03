import {
	COUNTIES,
	type CountyCode,
	REGIONS,
	type RegionCode,
} from "~/modules/domain";

export const EMPTY_LOCATION_LABEL = "—";

export function formatRegionLabel(code: string): string {
	if (!code) return EMPTY_LOCATION_LABEL;
	return `${REGIONS[code as RegionCode] ?? code} (${code})`;
}

export function formatCountyLabel(code: string | null | undefined): string {
	if (!code) return EMPTY_LOCATION_LABEL;
	return `${COUNTIES[code as CountyCode] ?? code} (${code})`;
}
