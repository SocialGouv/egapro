import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SCRIPT_PATH = join(APP_ROOT, "scripts/check-journal.mjs");

const { findMonotoneViolations, checkJournal } = await import(SCRIPT_PATH);

function writeJournal(dir: string, entries: { idx: number; when: number }[]) {
	const path = join(dir, "_journal.json");
	writeFileSync(
		path,
		JSON.stringify({
			version: "7",
			dialect: "postgresql",
			entries: entries.map((e) => ({
				...e,
				version: "7",
				tag: `tag_${e.idx}`,
				breakpoints: true,
			})),
		}),
	);
	return path;
}

describe("findMonotoneViolations", () => {
	it("returns empty array for strictly monotone increasing entries", () => {
		expect(
			findMonotoneViolations([
				{ idx: 0, when: 100 },
				{ idx: 1, when: 200 },
				{ idx: 2, when: 300 },
			]),
		).toEqual([]);
	});

	it("detects a later entry with a smaller 'when' than an earlier entry", () => {
		const violations = findMonotoneViolations([
			{ idx: 0, when: 100 },
			{ idx: 1, when: 50 },
			{ idx: 2, when: 300 },
		]);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("idx 0");
		expect(violations[0]).toContain("idx 1");
	});

	it("detects equal 'when' values as a violation", () => {
		const violations = findMonotoneViolations([
			{ idx: 0, when: 100 },
			{ idx: 1, when: 100 },
		]);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("idx 0");
		expect(violations[0]).toContain("idx 1");
	});

	it("detects the original bug #3557 scenario (idx 37 when < idx 36 when)", () => {
		const violations = findMonotoneViolations([
			{ idx: 35, when: 1778682813792 },
			{ idx: 36, when: 1779271468703 },
			{ idx: 37, when: 1779263787038 },
		]);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("idx 36");
		expect(violations[0]).toContain("idx 37");
	});

	it("returns empty after the fix (idx 37 when = 1779271468704)", () => {
		expect(
			findMonotoneViolations([
				{ idx: 35, when: 1778682813792 },
				{ idx: 36, when: 1779271468703 },
				{ idx: 37, when: 1779271468704 },
			]),
		).toEqual([]);
	});

	it("handles a single-entry list with no pairs to compare", () => {
		expect(findMonotoneViolations([{ idx: 0, when: 100 }])).toEqual([]);
	});

	it("reports all non-monotone pairs, not just the first", () => {
		const violations = findMonotoneViolations([
			{ idx: 0, when: 300 },
			{ idx: 1, when: 100 },
			{ idx: 2, when: 50 },
		]);
		expect(violations).toHaveLength(2);
		expect(violations[0]).toContain("idx 0");
		expect(violations[0]).toContain("idx 1");
		expect(violations[1]).toContain("idx 1");
		expect(violations[1]).toContain("idx 2");
	});
});

describe("checkJournal", () => {
	it("returns empty array for a valid monotone journal file", () => {
		const dir = mkdtempSync(join(tmpdir(), "check-journal-test-"));
		const journalPath = writeJournal(dir, [
			{ idx: 0, when: 100 },
			{ idx: 1, when: 200 },
		]);
		expect(checkJournal(journalPath)).toEqual([]);
	});

	it("returns violations for a non-monotone journal file", () => {
		const dir = mkdtempSync(join(tmpdir(), "check-journal-test-"));
		const journalPath = writeJournal(dir, [
			{ idx: 0, when: 200 },
			{ idx: 1, when: 100 },
		]);
		const violations = checkJournal(journalPath);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("idx 0");
	});

	it("throws a user-friendly error when the file does not exist", () => {
		expect(() => checkJournal("/nonexistent/path/_journal.json")).toThrow(
			/Failed to read or parse journal/,
		);
	});

	it("throws a user-friendly error when the file contains invalid JSON", () => {
		const dir = mkdtempSync(join(tmpdir(), "check-journal-test-"));
		const badPath = join(dir, "_journal.json");
		writeFileSync(badPath, "not json");
		expect(() => checkJournal(badPath)).toThrow(
			/Failed to read or parse journal/,
		);
	});

	it("throws a user-friendly error when 'entries' array is missing", () => {
		const dir = mkdtempSync(join(tmpdir(), "check-journal-test-"));
		const badPath = join(dir, "_journal.json");
		writeFileSync(badPath, JSON.stringify({ version: "7" }));
		expect(() => checkJournal(badPath)).toThrow(/missing "entries" array/);
	});
});

describe("check-journal.mjs script file", () => {
	it("script file exists", () => {
		expect(existsSync(SCRIPT_PATH)).toBe(true);
	});
});
