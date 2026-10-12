import { describe, expect, it, vi } from "vitest";
import { formatCount } from "~/modules/domain";
import {
	fetchWithinExportLimit,
	MAX_EXPORT_ROWS,
	MAX_XLSX_EXPORT_ROWS,
	PUBLIC_EXPORT_BUSY_MESSAGE,
	PUBLIC_EXPORT_RETRY_AFTER_SECONDS,
	publicExportBusyResponse,
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

	it("probes the cap on the light projection and only then loads the rows", async () => {
		const probeRows = vi.fn(async () => ["siren"]);
		const fetchRows = vi.fn(async () => ["row"]);

		const rows = await fetchWithinExportLimit("xlsx", fetchRows, probeRows);

		expect(probeRows).toHaveBeenCalledWith(MAX_XLSX_EXPORT_ROWS + 1);
		expect(fetchRows).toHaveBeenCalledWith(MAX_XLSX_EXPORT_ROWS);
		expect(rows).toEqual(["row"]);
	});

	it("never loads the full rows once the light probe exceeds the cap", async () => {
		const fetchRows = vi.fn(async () => ["row"]);

		const result = await fetchWithinExportLimit(
			"xlsx",
			fetchRows,
			async (limit) => new Array<string>(limit),
		);

		expect(fetchRows).not.toHaveBeenCalled();
		if (!(result instanceof Response)) throw new Error("expected a Response");
		expect(result.status).toBe(413);
	});
});

describe("publicExportBusyResponse", () => {
	it("answers an uncacheable 503 with Retry-After and a French message", async () => {
		const response = publicExportBusyResponse();

		expect(response.status).toBe(503);
		expect(response.headers.get("Retry-After")).toBe(
			String(PUBLIC_EXPORT_RETRY_AFTER_SECONDS),
		);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(await response.json()).toEqual({
			error: PUBLIC_EXPORT_BUSY_MESSAGE,
		});
	});
});
