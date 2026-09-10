import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type JournalEntry = { idx: number; when: number };

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function readEntries(journal: unknown): JournalEntry[] | null {
	if (typeof journal !== "object" || journal === null) return null;
	const { entries } = journal as { entries?: unknown };
	return Array.isArray(entries) ? (entries as JournalEntry[]) : null;
}

export function findMonotoneViolations(entries: JournalEntry[]): string[] {
	const sorted = [...entries].sort((a, b) => a.idx - b.idx);
	const violations: string[] = [];
	for (let i = 0; i < sorted.length - 1; i++) {
		const current = sorted[i];
		const next = sorted[i + 1];
		if (!current || !next) continue;
		if (current.when >= next.when) {
			violations.push(
				`idx ${current.idx} (when=${current.when}) >= idx ${next.idx} (when=${next.when})`,
			);
		}
	}
	return violations;
}

export function checkJournal(journalPath: string): string[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(readFileSync(journalPath, "utf-8"));
	} catch (err) {
		throw new Error(
			`Failed to read or parse journal at "${journalPath}": ${describeError(err)}`,
		);
	}
	const entries = readEntries(parsed);
	if (!entries) {
		throw new Error(
			`Invalid journal format at "${journalPath}": missing "entries" array.`,
		);
	}
	return findMonotoneViolations(entries);
}

const journalPath = join(__dirname, "../drizzle/meta/_journal.json");
let parsed: unknown;
try {
	parsed = JSON.parse(readFileSync(journalPath, "utf-8"));
} catch (err) {
	console.error(
		`ERROR: Failed to read or parse journal at "${journalPath}": ${describeError(err)}`,
	);
	process.exit(1);
}
const entries = readEntries(parsed);
if (!entries) {
	console.error(
		`ERROR: Invalid journal format at "${journalPath}": missing "entries" array.`,
	);
	process.exit(1);
}
const violations = findMonotoneViolations(entries);

if (violations.length > 0) {
	console.error(
		"ERROR: drizzle journal 'when' timestamps are not strictly monotone increasing:",
	);
	for (const v of violations) {
		console.error(`  ${v}`);
	}
	console.error(
		"\nFix: bump the 'when' value of the later migration to be greater than the previous one.",
	);
	process.exit(1);
}

console.log(`OK: journal monotone check passed (${entries.length} entries).`);
