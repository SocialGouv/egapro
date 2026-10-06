import { describe, expect, it, vi } from "vitest";
import { formatCount } from "~/modules/domain";
import {
	fetchWithinExportLimit,
	MAX_EXPORT_ROWS,
	MAX_XLSX_EXPORT_ROWS,
} from "../exportLimits";

describe("fetchWithinExportLimit", () => {
	it.each([
		["json", MAX_EXPORT_ROWS],
		["csv", MAX_EXPORT_ROWS],
		["xlsx", MAX_XLSX_EXPORT_ROWS],
	] as const)("probes one row past the %s cap", async (format, cap) => {
		const fetchRows = vi.fn(async () => ["row"]);

		const rows = await fetchWithinExportLimit(format, fetchRows);

		expect(fetchRows).toHaveBeenCalledWith(cap + 1);
		expect(rows).toEqual(["row"]);
	});

	it("returns the rows when the result reaches the cap exactly", async () => {
		const rows = new Array<string>(MAX_XLSX_EXPORT_ROWS);

		const result = await fetchWithinExportLimit("xlsx", async () => rows);

		expect(result).toBe(rows);
	});

	it.each([
		["json", MAX_EXPORT_ROWS],
		["csv", MAX_EXPORT_ROWS],
		["xlsx", MAX_XLSX_EXPORT_ROWS],
	] as const)("answers 413 when a %s export exceeds its cap", async (format, cap) => {
		const result = await fetchWithinExportLimit(
			format,
			async (limit) => new Array<string>(limit),
		);

		if (!(result instanceof Response)) throw new Error("expected a Response");
		expect(result.status).toBe(413);
		expect(result.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(result.headers.get("Cache-Control")).toContain("max-age=3600");
		expect(await result.json()).toEqual({
			error: expect.stringContaining(`${formatCount(cap)} lignes`),
		});
	});

	it("points an oversized Excel export to the CSV format", async () => {
		const result = await fetchWithinExportLimit(
			"xlsx",
			async (limit) => new Array<string>(limit),
		);

		if (!(result instanceof Response)) throw new Error("expected a Response");
		expect((await result.json()).error).toContain("format CSV");
	});

	it("points an oversized JSON or CSV export to the year filter", async () => {
		const result = await fetchWithinExportLimit(
			"csv",
			async (limit) => new Array<string>(limit),
		);

		if (!(result instanceof Response)) throw new Error("expected a Response");
		expect((await result.json()).error).toContain("year");
	});
});
