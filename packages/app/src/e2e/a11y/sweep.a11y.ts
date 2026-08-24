import { sweepSample } from "ultra11y/playwright";

import { SNAPSHOTTED_ELSEWHERE } from "./ownership";
import { settle } from "./snapshot";

/**
 * The sweep of the declared pages.
 *
 * One instruction: `.ultra11yrc.json` already says what each page is — its id, its name, its
 * URL, whether it sits behind ProConnect, and the sources that render it. `sweepSample`
 * declares one test per page, navigates, checks the browser stayed there (path **and** HTTP
 * status), then records the snapshot under the declared identity. A page the current state
 * does not open is skipped with its reason, never recorded under another name.
 *
 * This file replaces a 156-line route table and the two specs that iterated it. That table
 * restated what the sample already says, and two copies of one list drift: a page renamed on
 * one side kept its old identity in the report.
 *
 * The LIVE PROBES run here too, and nothing below asks for them: `sweepSample` turns them on
 * itself since ultra11y 5.8.0. That default is the fix for a real hole in this suite. This
 * sweep owns 15 of the pages the report is built from, and it recorded them without probing;
 * conformity on zoom (10.4), reflow (10.11), text spacing (10.12) and content on hover is an
 * AND across EVERY page in scope, so those criteria stayed « à évaluer » for the whole audit —
 * including on the five pages `snapshot.ts` had explicitly probed. Fifteen silent pages closed
 * the door for all of them.
 *
 * Opt out with `check: { probes: false }`, or bound them in `.ultra11yrc.json` under `probes`.
 */
sweepSample({
	settle,
	only: (p) => !SNAPSHOTTED_ELSEWHERE.has(p.id),
});
