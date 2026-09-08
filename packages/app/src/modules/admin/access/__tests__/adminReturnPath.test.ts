import { describe, expect, it } from "vitest";

import {
	ADMIN_HOME_PATH,
	isAdminReturnPath,
	sanitizeAdminReturnPath,
} from "../adminReturnPath";

describe("sanitizeAdminReturnPath", () => {
	it("keeps a backoffice deep link", () => {
		expect(sanitizeAdminReturnPath("/admin/declarations/abc")).toBe(
			"/admin/declarations/abc",
		);
	});

	it("keeps the query string of a backoffice deep link", () => {
		expect(
			sanitizeAdminReturnPath("/admin/declarations?onglet=historique"),
		).toBe("/admin/declarations?onglet=historique");
	});

	it("resolves dot segments inside the backoffice", () => {
		expect(sanitizeAdminReturnPath("/admin/stats/../declarations")).toBe(
			"/admin/declarations",
		);
	});

	it("keeps a fragment on a backoffice path", () => {
		expect(sanitizeAdminReturnPath("/admin#contenu")).toBe("/admin#contenu");
	});

	it("keeps the backoffice home itself", () => {
		expect(sanitizeAdminReturnPath(ADMIN_HOME_PATH)).toBe(ADMIN_HOME_PATH);
	});

	it.each([
		["nothing at all", undefined],
		["an empty string", ""],
		["a path outside the backoffice", "/mon-espace"],
		["the site root", "/"],
		// `/administration` merely shares a prefix with `/admin`: the comparison
		// is segment-aware, so this must not be mistaken for a backoffice path.
		["a path that only shares the prefix", "/administration/secret"],
		["dot segments escaping the backoffice", "/admin/../mon-espace"],
		["dot segments climbing above the root", "/admin/../../mon-espace"],
		["encoded dot segments", "/admin/%2E%2E/mon-espace"],
		["a relative path", "admin/declarations"],
		["an absolute URL", "https://evil.example/admin"],
		["a protocol-relative URL", "//evil.example/admin"],
		["a backslash authority", "/\\evil.example/admin"],
		["a percent-encoded authority", "/%2F%2Fevil.example/admin"],
		["malformed percent-encoding", "/admin/%E0%A4%A"],
	])("falls back to the backoffice home for %s", (_label, value) => {
		expect(sanitizeAdminReturnPath(value)).toBe(ADMIN_HOME_PATH);
	});
});

describe("isAdminReturnPath", () => {
	it("recognizes the backoffice home", () => {
		expect(isAdminReturnPath(ADMIN_HOME_PATH)).toBe(true);
	});

	it("recognizes a backoffice deep link", () => {
		expect(isAdminReturnPath("/admin/declarations/abc")).toBe(true);
	});

	it("recognizes a backoffice path with a query string", () => {
		expect(isAdminReturnPath("/admin?onglet=historique")).toBe(true);
	});

	it("recognizes a backoffice path with a fragment", () => {
		expect(isAdminReturnPath("/admin#contenu")).toBe(true);
	});

	it("recognizes a backoffice destination reached through dot segments", () => {
		// Same normalization as sanitizeAdminReturnPath: a caller testing the
		// raw, not-yet-resolved string must see this as backoffice-bound too.
		expect(isAdminReturnPath("/mon-espace/../admin")).toBe(true);
	});

	it.each([
		["an empty string", ""],
		["a path outside the backoffice", "/mon-espace"],
		["the site root", "/"],
		// `/administration` merely shares a prefix with `/admin`: the comparison
		// is segment-aware, so this must not be mistaken for a backoffice path.
		["a path that only shares the prefix", "/administration/secret"],
		["dot segments escaping the backoffice", "/admin/../mon-espace"],
		["a relative path", "admin/declarations"],
		["an absolute URL", "https://evil.example/admin"],
		["a protocol-relative URL", "//evil.example/admin"],
		["a backslash authority", "/\\evil.example/admin"],
	])("does not recognize %s", (_label, value) => {
		expect(isAdminReturnPath(value)).toBe(false);
	});
});
