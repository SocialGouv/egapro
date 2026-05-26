import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
} from "./constants";
import { isTriennialYear } from "./indicatorG";

export function isObligatedForYear(workforce: number, year: number): boolean {
	if (workforce < COMPANY_SIZE_VOLUNTARY_MAX) return false;
	if (workforce < COMPANY_SIZE_ANNUAL_MIN) return isTriennialYear(year);
	return true;
}
