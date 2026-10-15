import { describe, expect, it } from "vitest";

import {
	getCurrentTermsOfUseVersion,
	resolveTermsOfUseVersion,
	TERMS_OF_USE_VERSIONS,
	type TermsOfUseVersion,
} from "../TermsOfUsePage/termsOfUseVersions";

function FakeContent() {
	return null;
}

const FICTIONAL_VERSIONS: readonly TermsOfUseVersion[] = [
	{ effectiveDate: "2027-03-01", Content: FakeContent },
	{ effectiveDate: "2026-10-12", Content: FakeContent },
	{ effectiveDate: "2025-01-15", Content: FakeContent },
];

describe("TERMS_OF_USE_VERSIONS", () => {
	it("gives every version a valid ISO date", () => {
		for (const version of TERMS_OF_USE_VERSIONS) {
			expect(version.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		}
	});

	it("never registers the same date twice", () => {
		const dates = TERMS_OF_USE_VERSIONS.map((version) => version.effectiveDate);
		expect(new Set(dates).size).toBe(dates.length);
	});

	it("orders versions strictly from the most to the least recent", () => {
		const dates = TERMS_OF_USE_VERSIONS.map((version) => version.effectiveDate);
		const sortedMostRecentFirst = [...dates].sort((a, b) => (a < b ? 1 : -1));
		// Non-increasing here, combined with the uniqueness test above, means strictly decreasing.
		expect(dates).toEqual(sortedMostRecentFirst);
	});
});

describe("getCurrentTermsOfUseVersion", () => {
	it("returns the first entry of the registry", () => {
		expect(getCurrentTermsOfUseVersion(FICTIONAL_VERSIONS)).toBe(
			FICTIONAL_VERSIONS[0],
		);
	});

	it("defaults to the real registry when no list is given", () => {
		expect(getCurrentTermsOfUseVersion()).toBe(TERMS_OF_USE_VERSIONS[0]);
	});

	it("throws if the registry is empty", () => {
		expect(() => getCurrentTermsOfUseVersion([])).toThrow(
			"No terms of use version registered.",
		);
	});
});

describe("resolveTermsOfUseVersion", () => {
	it("resolves the in-force date to the current version", () => {
		expect(resolveTermsOfUseVersion("2027-03-01", FICTIONAL_VERSIONS)).toEqual({
			kind: "current",
		});
	});

	it("resolves an archived date to its own entry", () => {
		expect(resolveTermsOfUseVersion("2026-10-12", FICTIONAL_VERSIONS)).toEqual({
			kind: "archived",
			version: FICTIONAL_VERSIONS[1],
		});
	});

	it("resolves the oldest archived date too", () => {
		expect(resolveTermsOfUseVersion("2025-01-15", FICTIONAL_VERSIONS)).toEqual({
			kind: "archived",
			version: FICTIONAL_VERSIONS[2],
		});
	});

	it("reports an unknown date as not found", () => {
		expect(resolveTermsOfUseVersion("1999-01-01", FICTIONAL_VERSIONS)).toEqual({
			kind: "not-found",
		});
	});

	it("reports every date as not found against an empty registry", () => {
		expect(resolveTermsOfUseVersion("2026-10-12", [])).toEqual({
			kind: "not-found",
		});
	});
});
