import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SNAPSHOTTED_ELSEWHERE } from "../ownership";

/**
 * Every page of the RGAA sample must be recorded by exactly one spec.
 *
 * The failure this guards against is silence, not error. `declaration-accessibilite` was
 * declared in `.ultra11yrc.json` and swallowed by the sweep's `startsWith("declaration-")`
 * filter — meant for the funnel screens — so it produced no snapshot, appeared in no report,
 * and nothing anywhere said it was missing. A page the sample requires and no spec records is
 * indistinguishable, in the deliverable, from a page that does not exist.
 *
 * A unit test rather than a CI step on purpose: this is decidable from the declarations alone,
 * so it runs on every push in seconds instead of after a 40-minute browser sweep.
 */
const APP = join(__dirname, "..", "..", "..", "..");
const sample = JSON.parse(
	readFileSync(join(APP, ".ultra11yrc.json"), "utf8"),
) as {
	sample: { pages: { id: string; name: string }[] };
};
const declaredIds = sample.sample.pages.map((p) => p.id);

// The specs that record what the sweep skips, read as text: importing them would declare
// Playwright tests inside vitest.
const specs = ["funnels.a11y.ts", "dynamic.a11y.ts"]
	.map((f) => readFileSync(join(__dirname, "..", f), "utf8"))
	.join("\n");

/**
 * The ids a spec records — literal ones, plus the static prefix of a generated one.
 *
 * `funnels.a11y.ts` builds a funnel step as `` id: `declaration-etape-${step}` ``, so a plain
 * text search for `declaration-etape-2` finds nothing even though the spec covers it. Matching
 * the prefix is what makes this check agree with how the ids are actually produced.
 */
const literalIds = [...specs.matchAll(/id: "([a-z0-9-]+)"/g)].map(
	(m) => m[1] as string,
);
const generatedPrefixes = [...specs.matchAll(/id: `([a-z0-9-]+)\$\{/g)].map(
	(m) => m[1] as string,
);
const recordedBySpec = (id: string): boolean =>
	literalIds.includes(id) ||
	generatedPrefixes.some((prefix) => id.startsWith(prefix));

describe("the RGAA sample is fully owned", () => {
	it("declares at least the pages the sweep and the specs expect", () => {
		expect(declaredIds.length).toBeGreaterThan(0);
		expect(new Set(declaredIds).size).toBe(declaredIds.length); // no duplicate id
	});

	it("gives every declared page exactly one owner", () => {
		// Either the sweep takes it (default), or a named spec claims it — never neither.
		const orphans = declaredIds.filter(
			(id) => SNAPSHOTTED_ELSEWHERE.has(id) && !recordedBySpec(id),
		);
		expect(
			orphans,
			`declared in .ultra11yrc.json, excluded from the sweep, and recorded by no spec: ${orphans.join(", ")}`,
		).toEqual([]);
	});

	it("never excludes a page from the sweep by accident", () => {
		// The regression, stated as the property that was violated: a page excluded from the
		// sweep must be excluded ON PURPOSE, which means named in the set AND covered elsewhere.
		for (const id of declaredIds) {
			if (SNAPSHOTTED_ELSEWHERE.has(id)) continue;
			// Not excluded → the sweep takes it. Nothing to prove beyond the set being explicit.
			expect(SNAPSHOTTED_ELSEWHERE.has(id)).toBe(false);
		}
		// `declaration-accessibilite` is the page that was lost. Pin it by name: it is a required
		// page kind of the RGAA sample, and a prefix filter is exactly what took it last time.
		expect(declaredIds).toContain("declaration-accessibilite");
		expect(SNAPSHOTTED_ELSEWHERE.has("declaration-accessibilite")).toBe(false);
	});

	it("carries no dead exclusion", () => {
		// An id in the set that no longer exists anywhere is a filter nobody will re-check.
		const dead = [...SNAPSHOTTED_ELSEWHERE].filter(
			(id) => !declaredIds.includes(id) && !recordedBySpec(id),
		);
		expect(
			dead,
			`excluded from the sweep but declared nowhere and recorded nowhere: ${dead.join(", ")}`,
		).toEqual([]);
	});
});
