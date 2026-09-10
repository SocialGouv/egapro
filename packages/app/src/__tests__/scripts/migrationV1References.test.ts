import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { COUNTIES, REGIONS } from "~/modules/domain";

function readReference(name: string): Record<string, string> {
	const path = resolve(
		dirname(fileURLToPath(import.meta.url)),
		"..",
		"..",
		"..",
		"..",
		"..",
		"scripts",
		"migration-v1",
		"reference",
		name,
	);
	const [header, ...rows] = readFileSync(path, "utf8").trim().split("\n");
	expect(header).toBe("code,label");

	return Object.fromEntries(
		rows.map((row) => {
			const separator = row.indexOf(",");
			return [row.slice(0, separator), row.slice(separator + 1)];
		}),
	);
}

describe("V1 migration geographic references", () => {
	it("keeps SQL region labels aligned with the domain", () => {
		expect(readReference("regions.csv")).toEqual(REGIONS);
	});

	it("keeps SQL department labels aligned with the domain", () => {
		expect(readReference("departments.csv")).toEqual(COUNTIES);
	});
});
