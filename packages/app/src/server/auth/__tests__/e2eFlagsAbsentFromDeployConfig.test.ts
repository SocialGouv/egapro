import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tooling assertion for the test-only seams (issues #4022 and #4467).
 *
 * Both are gated by an environment flag whose safety argument is "it is
 * declared in no deployment configuration, verifiable with a single grep".
 * That argument is only worth something if something actually greps: the day
 * someone adds one of these flags to a `.kontinuous` configmap to unblock a
 * review app, nothing else in the repo would notice, and the seam would ship
 * to preproduction — then to production on the next promotion.
 *
 * The check reads the deployment tree rather than a curated list of files, so
 * a flag added to a configmap that does not exist yet is caught too.
 */

const KONTINUOUS_DIR = join(process.cwd(), "..", "..", ".kontinuous");

const TEST_ONLY_FLAGS = ["EGAPRO_E2E_CLOCK", "EGAPRO_E2E_ADMIN_MFA"] as const;

function collectFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		return statSync(path).isDirectory() ? collectFiles(path) : [path];
	});
}

describe("test-only environment flags", () => {
	const files = collectFiles(KONTINUOUS_DIR);

	it("reads a non-empty deployment configuration tree", () => {
		// Without this, a renamed or moved `.kontinuous` would make every
		// assertion below pass over zero files and report a clean bill of health.
		expect(files.length).toBeGreaterThan(0);
	});

	it.each(
		TEST_ONLY_FLAGS,
	)("%s appears in no .kontinuous deployment configuration", (flag) => {
		const offenders = files.filter((path) =>
			readFileSync(path, "utf-8").includes(flag),
		);

		expect(offenders).toEqual([]);
	});
});
