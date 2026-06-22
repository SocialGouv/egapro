import { describe, expect, it } from "vitest";

import { sanitizeCallbackUrl } from "../sanitizeCallbackUrl";

describe("sanitizeCallbackUrl", () => {
	it("returns the path unchanged for a safe relative path", () => {
		expect(sanitizeCallbackUrl("/admin/users")).toBe("/admin/users");
	});

	it("preserves the query string on a safe relative path", () => {
		expect(sanitizeCallbackUrl("/mon-espace/historique/123456789/2024")).toBe(
			"/mon-espace/historique/123456789/2024",
		);
		expect(sanitizeCallbackUrl("/avis-cse?annee=2024")).toBe(
			"/avis-cse?annee=2024",
		);
	});

	it("accepts the root path", () => {
		expect(sanitizeCallbackUrl("/")).toBe("/");
	});

	it("returns undefined when value is undefined", () => {
		expect(sanitizeCallbackUrl(undefined)).toBeUndefined();
	});

	it("returns undefined for an empty string", () => {
		expect(sanitizeCallbackUrl("")).toBeUndefined();
	});

	it("rejects absolute URLs (open-redirect)", () => {
		expect(sanitizeCallbackUrl("https://evil.com")).toBeUndefined();
		expect(sanitizeCallbackUrl("http://evil.com/admin")).toBeUndefined();
	});

	it("rejects protocol-relative URLs (`//evil.com`)", () => {
		expect(sanitizeCallbackUrl("//evil.com")).toBeUndefined();
		expect(sanitizeCallbackUrl("//evil.com/path")).toBeUndefined();
	});

	it("rejects backslash-prefixed paths that browsers resolve as protocol-relative", () => {
		expect(sanitizeCallbackUrl("/\\evil.com")).toBeUndefined();
		expect(sanitizeCallbackUrl("/\\evil.com/admin")).toBeUndefined();
	});

	it("rejects paths that do not start with /", () => {
		expect(sanitizeCallbackUrl("admin/users")).toBeUndefined();
		expect(sanitizeCallbackUrl("javascript:alert(1)")).toBeUndefined();
		expect(sanitizeCallbackUrl("mailto:foo@bar")).toBeUndefined();
	});

	it("rejects URL-encoded protocol-relative paths (`/%2F%2Fevil.com`)", () => {
		expect(sanitizeCallbackUrl("/%2F%2Fevil.com")).toBeUndefined();
		expect(sanitizeCallbackUrl("/%2Fevil.com")).toBeUndefined();
	});

	it("rejects URL-encoded backslash paths (`/%5Cevil.com`)", () => {
		expect(sanitizeCallbackUrl("/%5Cevil.com")).toBeUndefined();
	});

	it("rejects malformed percent-encoding", () => {
		expect(sanitizeCallbackUrl("/%E0%A4%A")).toBeUndefined();
	});
});
