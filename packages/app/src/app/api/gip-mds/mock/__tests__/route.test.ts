import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	clearCampaignYearOverride,
	getCurrentYear,
	writeCampaignYearOverride,
} from "~/modules/domain";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		NEXT_PUBLIC_EGAPRO_ENV: "dev" as "dev" | "preprod" | "prod",
	},
}));

vi.mock("~/env.js", () => ({ env: mockEnv }));

import { GET } from "../route";

const METADATA_LINE_INDEX = 1;

async function readBundledCsvLines(): Promise<string[]> {
	const csv = await readFile(
		join(process.cwd(), "data", "mock-gip-mds.csv"),
		"utf-8",
	);
	return csv.split("\n");
}

async function servedPeriod(): Promise<{ start: string; end: string }> {
	const lines = (await (await GET()).text()).split("\n");
	const fields = lines[METADATA_LINE_INDEX]?.split(";") ?? [];
	return { start: fields[3] ?? "", end: fields[4] ?? "" };
}

describe("GET /api/gip-mds/mock", () => {
	beforeEach(() => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = "dev";
	});

	it("serves the mock CSV on dev builds (local, E2E, review apps)", async () => {
		const response = await GET();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"text/csv; charset=utf-8",
		);
		expect((await response.text()).length).toBeGreaterThan(0);
	});

	describe("reference period", () => {
		afterEach(() => {
			clearCampaignYearOverride();
		});

		it("covers the current campaign year", async () => {
			const year = getCurrentYear();

			await expect(servedPeriod()).resolves.toEqual({
				start: `${year}-01-01`,
				end: `${year}-12-31`,
			});
		});

		it("follows a pinned campaign year", async () => {
			writeCampaignYearOverride(2030);

			await expect(servedPeriod()).resolves.toEqual({
				start: "2030-01-01",
				end: "2030-12-31",
			});
		});

		it("leaves every other line and metadata field of the file untouched", async () => {
			writeCampaignYearOverride(2030);
			const bundled = await readBundledCsvLines();
			const served = (await (await GET()).text()).split("\n");

			const withoutPeriod = (line: string | undefined) =>
				(line ?? "")
					.split(";")
					.filter((_, index) => index !== 3 && index !== 4);

			expect(served).toHaveLength(bundled.length);
			expect(withoutPeriod(served[METADATA_LINE_INDEX])).toEqual(
				withoutPeriod(bundled[METADATA_LINE_INDEX]),
			);
			expect(
				served.filter((_, index) => index !== METADATA_LINE_INDEX),
			).toEqual(bundled.filter((_, index) => index !== METADATA_LINE_INDEX));
		});
	});

	it.each(["preprod", "prod"] as const)("answers 404 on %s", async (target) => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = target;

		const response = await GET();

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("");
	});
});
