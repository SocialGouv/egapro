import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function findMonotoneViolations(entries) {
	const sorted = [...entries].sort((a, b) => a.idx - b.idx);
	const violations = [];
	for (let i = 0; i < sorted.length - 1; i++) {
		const current = sorted[i];
		const next = sorted[i + 1];
		if (current.when >= next.when) {
			violations.push(
				`idx ${current.idx} (when=${current.when}) >= idx ${next.idx} (when=${next.when})`,
			);
		}
	}
	return violations;
}

export function checkJournal(journalPath) {
	let journal;
	try {
		journal = JSON.parse(readFileSync(journalPath, "utf-8"));
	} catch (err) {
		throw new Error(
			`Failed to read or parse journal at "${journalPath}": ${err.message}`,
		);
	}
	if (!Array.isArray(journal?.entries)) {
		throw new Error(
			`Invalid journal format at "${journalPath}": missing "entries" array.`,
		);
	}
	return findMonotoneViolations(journal.entries);
}

const journalPath = join(__dirname, "../drizzle/meta/_journal.json");
let journal;
try {
	journal = JSON.parse(readFileSync(journalPath, "utf-8"));
} catch (err) {
	console.error(
		`ERROR: Failed to read or parse journal at "${journalPath}": ${err.message}`,
	);
	process.exit(1);
}
if (!Array.isArray(journal?.entries)) {
	console.error(
		`ERROR: Invalid journal format at "${journalPath}": missing "entries" array.`,
	);
	process.exit(1);
}
const violations = findMonotoneViolations(journal.entries);

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

console.log(
	`OK: journal monotone check passed (${journal.entries.length} entries).`,
);
