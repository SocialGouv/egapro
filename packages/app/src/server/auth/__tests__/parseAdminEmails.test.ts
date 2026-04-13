import { describe, expect, it } from "vitest";

import { parseAdminEmails } from "../parseAdminEmails";

describe("parseAdminEmails", () => {
	it("returns an empty set for undefined", () => {
		expect(parseAdminEmails(undefined).size).toBe(0);
	});

	it("returns an empty set for null", () => {
		expect(parseAdminEmails(null).size).toBe(0);
	});

	it("returns an empty set for an empty string", () => {
		expect(parseAdminEmails("").size).toBe(0);
	});

	it("parses a single email", () => {
		expect(parseAdminEmails("alice@example.com")).toEqual(
			new Set(["alice@example.com"]),
		);
	});

	it("parses a comma-separated list", () => {
		expect(parseAdminEmails("alice@example.com,bob@example.com")).toEqual(
			new Set(["alice@example.com", "bob@example.com"]),
		);
	});

	it("trims whitespace around each entry", () => {
		expect(parseAdminEmails(" alice@example.com , bob@example.com ")).toEqual(
			new Set(["alice@example.com", "bob@example.com"]),
		);
	});

	it("lowercases every entry", () => {
		expect(parseAdminEmails("Alice@Example.com,BOB@EXAMPLE.COM")).toEqual(
			new Set(["alice@example.com", "bob@example.com"]),
		);
	});

	it("drops empty entries (trailing comma, double comma, whitespace-only)", () => {
		expect(parseAdminEmails("alice@example.com,,  ,bob@example.com,")).toEqual(
			new Set(["alice@example.com", "bob@example.com"]),
		);
	});

	it("deduplicates equivalent entries", () => {
		expect(parseAdminEmails("alice@example.com,Alice@Example.com")).toEqual(
			new Set(["alice@example.com"]),
		);
	});
});
