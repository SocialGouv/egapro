import type { Sql } from "postgres";
import { describe, expect, it } from "vitest";

import { hasRecentExportArchive } from "../exports.js";

const SINCE = new Date("2026-01-01T10:00:00.000Z");

function recordingSql(rows: unknown[]) {
	const calls: { text: string; values: readonly unknown[] }[] = [];
	const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
		calls.push({ text: strings.join("?"), values });
		return Promise.resolve(rows);
	}) as unknown as Sql;
	return { sql, calls };
}

describe("hasRecentExportArchive", () => {
	it("accepts a recent archive row", async () => {
		const { sql } = recordingSql([{ lastCreatedAt: new Date() }]);

		await expect(hasRecentExportArchive(sql, SINCE)).resolves.toBe(true);
	});

	it("rejects a success line with no archive in the window", async () => {
		const { sql } = recordingSql([{ lastCreatedAt: null }]);

		await expect(hasRecentExportArchive(sql, SINCE)).resolves.toBe(false);
	});

	it("rejects an empty table", async () => {
		const { sql } = recordingSql([]);

		await expect(hasRecentExportArchive(sql, SINCE)).resolves.toBe(false);
	});

	it("bounds the scan to the freshness window", async () => {
		const { sql, calls } = recordingSql([{ lastCreatedAt: null }]);

		await hasRecentExportArchive(sql, SINCE);

		expect(calls[0]?.text).toContain("WHERE created_at >= ?");
		expect(calls[0]?.values[0]).toBe(SINCE);
	});
});
