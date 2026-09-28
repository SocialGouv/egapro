import { describe, expect, it } from "vitest";
import {
	route,
	routeWithQuery,
	runtimeRoute,
	unroutedPath,
} from "../shared/routeContract";

// `route()` and `unroutedPath()` are identities at runtime — their whole job is
// at the type level, and the compiler is what tests them (`next build` with
// `typedRoutes`). What is worth pinning here is that they never rewrite a path.
describe("route / unroutedPath", () => {
	it("hand back the path untouched", () => {
		expect(route("/mon-espace")).toBe("/mon-espace");
		expect(unroutedPath("/api/v1/")).toBe("/api/v1/");
	});
});

describe("runtimeRoute", () => {
	it("hands back the path untouched", () => {
		expect(runtimeRoute("/whatever")).toBe("/whatever");
	});
});

describe("routeWithQuery", () => {
	it("appends a query string", () => {
		expect(routeWithQuery("/referents", "region=11")).toBe(
			"/referents?region=11",
		);
	});

	it("serialises URLSearchParams", () => {
		const params = new URLSearchParams({ page: "2", sortBy: "name" });
		expect(routeWithQuery("/admin/declarations", params)).toBe(
			"/admin/declarations?page=2&sortBy=name",
		);
	});

	it("leaves the path bare when the query is empty", () => {
		expect(routeWithQuery("/referents", "")).toBe("/referents");
		expect(routeWithQuery("/referents", new URLSearchParams())).toBe(
			"/referents",
		);
	});
});
