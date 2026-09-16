import { defineConfig } from "@playwright/test";

// Reassembles the five blob reports of the PR gate (2 shards of the main suite +
// 3 shards of the 185-coordinate grid) into one HTML report.
//
// It exists because `merge-reports` refuses to merge blobs recorded with
// different `testDir` values — and the gate deliberately runs two configs, one
// rooted on src/e2e and one on src/e2e/grille. The `-c` option is the documented
// way out: this file gives the merge a single root under which every test path
// of both configs resolves. Nothing here is a test-running config; it is only
// read by `playwright merge-reports`.
export default defineConfig({
	testDir: "./src/e2e",
	reporter: [
		["html", { open: "never", outputFolder: "playwright-report" }],
		// Machine-readable twin of the HTML report: the workflow reads it to publish
		// how many tests each project actually ran, which is the only place the
		// "every shard pulled its weight" claim can be checked after the fact.
		["json", { outputFile: "merged-results.json" }],
	],
});
