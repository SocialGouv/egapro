import { describe, expect, it } from "vitest";

import { extractSiren, formatSiren, parseSiren } from "../shared/siren";

describe("extractSiren", () => {
	it("extracts first 9 chars from a 14-digit SIRET", () => {
		expect(extractSiren("53284719600015")).toBe("532847196");
	});

	it("returns input as-is for a 9-digit string", () => {
		expect(extractSiren("532847196")).toBe("532847196");
	});
});

describe("formatSiren", () => {
	it("formats a 9-digit SIREN with spaces", () => {
		expect(formatSiren("532847196")).toBe("532 847 196");
	});
});

describe("parseSiren", () => {
	it("extracts SIREN from a valid 14-digit SIRET", () => {
		expect(parseSiren("53284719600015")).toBe("532847196");
	});

	it("extracts SIREN from a 9-digit string", () => {
		expect(parseSiren("532847196")).toBe("532847196");
	});

	it("returns null for undefined", () => {
		expect(parseSiren(undefined)).toBeNull();
	});

	it("returns null for null", () => {
		expect(parseSiren(null)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(parseSiren("")).toBeNull();
	});

	it("returns null for too short string", () => {
		expect(parseSiren("1234")).toBeNull();
	});

	it("returns null for non-numeric SIREN", () => {
		expect(parseSiren("ABCDEFGHI")).toBeNull();
	});
});
