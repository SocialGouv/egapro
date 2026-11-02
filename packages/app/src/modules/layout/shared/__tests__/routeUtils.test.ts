import { describe, expect, it } from "vitest";
import { isAdminRoute, isDemarcheRoute } from "../routeUtils";

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

describe("isDemarcheRoute", () => {
	it("returns true for the /mon-espace root", () => {
		expect(isDemarcheRoute("/mon-espace")).toBe(true);
	});

	it("returns true for a nested /mon-espace/* route (declaration history)", () => {
		expect(isDemarcheRoute("/mon-espace/historique/123456789/2025")).toBe(true);
	});

	it("returns true for the /declaration-remuneration root", () => {
		expect(isDemarcheRoute("/declaration-remuneration")).toBe(true);
	});

	it("returns true for a nested /declaration-remuneration/* route", () => {
		expect(isDemarcheRoute("/declaration-remuneration/etape/1")).toBe(true);
	});

	it("returns true for the /declaration-representation root", () => {
		expect(isDemarcheRoute("/declaration-representation")).toBe(true);
	});

	it("returns true for a nested /declaration-representation/* route", () => {
		expect(isDemarcheRoute("/declaration-representation/etape/1")).toBe(true);
	});

	it("returns true for the /avis-cse root", () => {
		expect(isDemarcheRoute("/avis-cse")).toBe(true);
	});

	it("returns true for a nested /avis-cse/* route", () => {
		expect(isDemarcheRoute("/avis-cse/etape/1")).toBe(true);
	});

	it("returns false for the home route", () => {
		expect(isDemarcheRoute("/")).toBe(false);
	});

	it("returns false for the aide route", () => {
		expect(isDemarcheRoute("/aide")).toBe(false);
	});

	it("returns false for the observatoire search route", () => {
		expect(isDemarcheRoute("/index-egapro/recherche")).toBe(false);
	});

	it("returns false for a sibling route merely starting with 'declaration-remuneration'", () => {
		expect(isDemarcheRoute("/declaration-remuneration-xyz")).toBe(false);
	});

	it("returns false for a sibling route merely starting with 'mon-espace'", () => {
		expect(isDemarcheRoute("/mon-espace-xyz")).toBe(false);
	});

	it("returns false for null", () => {
		expect(isDemarcheRoute(null)).toBe(false);
	});
});
