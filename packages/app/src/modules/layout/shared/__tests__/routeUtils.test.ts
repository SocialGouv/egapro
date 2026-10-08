import { describe, expect, it } from "vitest";
import { isAdminRoute, isMySpaceRoute } from "../routeUtils";

describe("isAdminRoute", () => {
	it("returns true for the /admin root", () => {
		expect(isAdminRoute("/admin")).toBe(true);
	});

	it("returns true for a nested /admin/* route", () => {
		expect(isAdminRoute("/admin/declarations")).toBe(true);
	});

	it("returns false for a sibling route merely starting with 'admin'", () => {
		expect(isAdminRoute("/administrator")).toBe(false);
	});

	it("returns false for an unrelated route", () => {
		expect(isAdminRoute("/")).toBe(false);
	});

	it("returns false for null", () => {
		expect(isAdminRoute(null)).toBe(false);
	});
});

describe("isMySpaceRoute", () => {
	it("returns true for the /mon-espace root", () => {
		expect(isMySpaceRoute("/mon-espace")).toBe(true);
	});

	it("returns true for a nested /mon-espace/* route (declaration history)", () => {
		expect(isMySpaceRoute("/mon-espace/historique/123456789/2025")).toBe(true);
	});

	it("returns false for the home route", () => {
		expect(isMySpaceRoute("/")).toBe(false);
	});

	it("returns false for the aide route", () => {
		expect(isMySpaceRoute("/aide")).toBe(false);
	});

	it("returns false for a sibling route merely starting with 'mon-espace'", () => {
		expect(isMySpaceRoute("/mon-espace-xyz")).toBe(false);
	});

	it("returns false for null", () => {
		expect(isMySpaceRoute(null)).toBe(false);
	});
});
