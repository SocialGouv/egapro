import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tooling assertions on the E2E gate.
 *
 * The gate spreads the main suite and the 185-coordinate grid over five runners,
 * and most of the properties that make it a gate at all fail SILENTLY — nothing
 * turns red, the check just stops covering what it claims to cover:
 *
 *  - Playwright disables its "no tests found" error under `--shard`, so an empty
 *    shard exits 0;
 *  - a job skipped because one of its `needs` failed counts as PASSING for branch
 *    protection, so the aggregator must run on `always()`;
 *  - Playwright shards top-level projects only and replays dependency projects
 *    whole, so putting `logout` back downstream of `chromium` — or restoring a
 *    file-level serial group on the grid — hands every test to shard 1 and leaves
 *    the others empty;
 *  - `workers: 1` is what still orders `chromium` before `logout` and what still
 *    serialises the grid's 185 coordinates once the dependency / serial group
 *    above is gone — raise it in either config and nothing turns red either;
 *  - `fail-fast: true` on the shard matrix would cancel every surviving shard the
 *    moment one turns red, and a cancelled shard reads the same as one that never
 *    ran.
 *
 * Each of those is one line away at any time, and none of them would show up in a
 * green run. Hence this file.
 */

const REPO_ROOT = join(process.cwd(), "..", "..");
const APP_ROOT = process.cwd();

const REQUIRED_CHECK_NAME = "Test e2e";

const workflow = readFileSync(
	join(REPO_ROOT, ".github", "workflows", "e2e.yaml"),
	"utf-8",
);

type Job = { id: string; body: string };

function parseJobs(source: string): Job[] {
	const lines = source.split("\n");
	const start = lines.indexOf("jobs:");
	const jobs: Job[] = [];
	for (const line of lines.slice(start + 1)) {
		const id = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line)?.[1];
		if (id !== undefined) {
			jobs.push({ id, body: "" });
			continue;
		}
		const current = jobs.at(-1);
		if (current) current.body += `${line}\n`;
	}
	return jobs;
}

function scalar(body: string, key: string): string | undefined {
	const match = new RegExp(`^ {4}${key}:[ \\t]*(.+)$`, "m").exec(body)?.[1];
	return match?.trim().replace(/^["']|["']$/g, "");
}

describe("E2E gate workflow", () => {
	const jobs = parseJobs(workflow);

	it("declares more than one job, otherwise every assertion below is vacuous", () => {
		expect(jobs.length).toBeGreaterThan(1);
	});

	const aggregators = jobs.filter(
		(job) => scalar(job.body, "name") === REQUIRED_CHECK_NAME,
	);
	const aggregatorBody = aggregators.at(0)?.body ?? "";

	it(`exposes exactly one job named "${REQUIRED_CHECK_NAME}"`, () => {
		// The name is the status-check context required by the protection of
		// `alpha`. A matrix job would publish "e2e suite 1/2" instead and the pull
		// request would wait on a context nobody ever emits.
		expect(aggregators.map((job) => job.id)).toHaveLength(1);
	});

	it("runs that job unconditionally", () => {
		expect(scalar(aggregatorBody, "if")).toBe("always()");
	});

	it("fails that job unless every dependency reported success", () => {
		expect(aggregatorBody).toContain("needs.shard.result");
		expect(aggregatorBody).toContain("needs.merge.result");
		expect(aggregatorBody).toMatch(/!=\s*"success"/);
	});

	it("makes that job wait on every other job of the workflow", () => {
		const needs = scalar(aggregatorBody, "needs") ?? "";
		const others = jobs
			.map((job) => job.id)
			.filter((id) => id !== aggregators.at(0)?.id);

		expect(others.length).toBeGreaterThan(0);
		for (const id of others) {
			expect(needs).toContain(id);
		}
	});

	it("carries no shard that is allowed to run nothing", () => {
		// `--pass-with-no-tests` would re-open by hand the hole the guard step closes.
		expect(workflow).not.toContain("--pass-with-no-tests");
	});

	it("never cancels the surviving shards when one of them turns red", () => {
		// A cancelled shard is indistinguishable from one that never ran: without
		// `fail-fast: false`, one red coordinate would take the whole grid's
		// diagnostic down with it.
		const shardBody = jobs.find((job) => job.body.includes("--shard="))?.body;

		expect(shardBody).toMatch(/fail-fast:\s*false/);
	});

	it("fails a shard that collects no test", () => {
		const shardBody = jobs.find((job) => job.body.includes("--shard="))?.body;

		expect(shardBody).toContain("--list");
		expect(shardBody).toMatch(/COUNT" -eq 0/);
	});

	it("shards every matrix entry against the count of its own suite", () => {
		const entries = [
			...workflow.matchAll(
				/- suite: (\w+)\n[\s\S]*?shard: (\d+)\n\s+total: (\d+)/g,
			),
		].map((match) => ({
			suite: match[1] ?? "",
			shard: Number(match[2]),
			total: Number(match[3]),
		}));

		expect(entries.length).toBeGreaterThan(1);
		for (const entry of entries) {
			const siblings = entries.filter((other) => other.suite === entry.suite);
			expect(siblings).toHaveLength(entry.total);
			expect(
				siblings.map((sibling) => sibling.shard).sort((a, b) => a - b),
			).toEqual(Array.from({ length: entry.total }, (_, index) => index + 1));
		}
	});

	const mergeBody = jobs.find((job) => job.id === "merge")?.body ?? "";

	function stepOf(name: string): string {
		const start = mergeBody.indexOf(`- name: ${name}`);
		if (start === -1) return "";
		const next = mergeBody.indexOf("- name: ", start + 1);
		return mergeBody.slice(start, next === -1 ? undefined : next);
	}

	it("publishes the complete merged recette report in the job summary", () => {
		const reportStep = stepOf("Generate the recette report");

		expect(reportStep).toContain("if: always()");
		expect(reportStep).toContain("report:grille");
		expect(reportStep).toContain("--results merged-results.json");
		expect(reportStep).toContain("--out playwright-report/grille-recette.md");
	});

	it("points the failure evidence at the uploaded report, which carries the traces", () => {
		const uploadStep = stepOf("Upload merged Playwright report");

		expect(uploadStep).toContain("id: upload-report");
		expect(mergeBody.indexOf(uploadStep)).toBeLessThan(
			mergeBody.indexOf(stepOf("Generate the recette report")),
		);
		expect(mergeBody).toContain("steps.upload-report.outputs.artifact-url");
	});

	it("links the run summary from one sticky comment on the pull request", () => {
		const commentStep = stepOf(
			"Comment the recette report on the pull request",
		);

		expect(commentStep).toContain("always()");
		expect(commentStep).toContain("github.event_name == 'pull_request'");
		expect(commentStep).toContain("<!-- e2e-recette-grille -->");
		expect(commentStep).toContain("PATCH");
		expect(mergeBody).toMatch(/pull-requests:\s*write/);
	});
});

describe("Playwright collection stays shardable", () => {
	it("keeps `logout` off the dependency chain of `chromium`", () => {
		// Playwright shards top-level projects only, and replays a dependency project
		// whole inside each shard that needs it. `dependencies: ["chromium"]` on
		// `logout` therefore demotes `chromium` to a dependency and collapses all 174
		// tests into shard 1 — measured, not feared.
		const config = readFileSync(
			join(APP_ROOT, "playwright.config.ts"),
			"utf-8",
		);
		const logout = config.slice(config.indexOf('name: "logout"'));

		expect(logout).toContain('dependencies: ["setup"]');
		expect(logout).not.toContain('"chromium"');
	});

	it("keeps one worker as the ordering guarantee between `chromium` and `logout`", () => {
		const config = readFileSync(
			join(APP_ROOT, "playwright.config.ts"),
			"utf-8",
		);

		expect(config).toMatch(/workers:\s*1/);
		// `workers: 1` alone only serialises execution; the invariant `logout`
		// depends on — releasing the shared user's locks after `chromium`, not
		// before it — also needs `chromium` declared first in the queue.
		const chromium = config.indexOf('name: "chromium"');
		const logout = config.indexOf('name: "logout"');

		expect(chromium).toBeGreaterThan(-1);
		expect(logout).toBeGreaterThan(chromium);
	});

	it("retries a failed `chromium` test before `logout`, not after it", () => {
		// `retries: 2` in CI re-dispatches failed tests. The default
		// `retryStrategy: "immediate"` puts them back at the head of the queue;
		// `"isolated"` appends them to the tail, where they would run once
		// `logout` has already released the shared user's declaration locks.
		const config = readFileSync(
			join(APP_ROOT, "playwright.config.ts"),
			"utf-8",
		);

		expect(config).not.toMatch(/retryStrategy:\s*["']isolated["']/);
	});

	it("keeps one worker as the only serialisation left on the grid", () => {
		// With the file-level serial group gone, `workers: 1` in the grid's OWN
		// config is what keeps the 185 coordinates off each other's shared SIREN —
		// the base config's `workers: 1` protects a different collection.
		const config = readFileSync(
			join(APP_ROOT, "playwright.grille.config.ts"),
			"utf-8",
		);

		expect(config).toMatch(/workers:\s*1/);
	});

	it("keeps the grid free of a file-level serial group", () => {
		// A serial group at file level makes the 185 coordinates one indivisible
		// block, which shards exactly as badly as the dependency above. Isolation
		// between coordinates comes from `withCampaignYear`, and sequential
		// execution from `workers: 1` — neither needs a serial group.
		const grid = readFileSync(
			join(APP_ROOT, "src", "e2e", "grille", "grille.grille.ts"),
			"utf-8",
		);

		expect(grid).toContain("buildGrid()");
		expect(grid).not.toMatch(/describe\.configure\(\s*\{\s*mode:\s*"serial"/);
	});
});
