import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { AUDIT_JOB_DEFINITIONS } from "../definitions.js";

/**
 * The four job crons are declared twice by necessity: the deployment manifests
 * own them, and this worker repeats them because the freshness rule must not be
 * re-derived by the screen (and a Kubernetes API client is refused). These
 * tests are what keeps the copy honest — a manifest edit that skips
 * `definitions.ts` fails here instead of silently shifting `next_expected_at`.
 */
const MANIFEST_OF: Record<string, string> = {
	"job-export-generate": ".kontinuous/templates/export-cron.yaml",
	"job-gip-mds-import": ".kontinuous/templates/gip-mds-import-cron.yaml",
	"job-declaration-cleanup":
		".kontinuous/templates/declaration-cleanup-cron.yaml",
	"job-audit-cleanup": ".kontinuous/templates/audit-cleanup-cron.yaml",
};

const REPO_ROOT = resolve(import.meta.dirname, "../../../../../..");

function read(relativePath: string): string {
	return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("audit job definitions", () => {
	it("covers every regulatory job exactly once, with a stable key", () => {
		const keys = AUDIT_JOB_DEFINITIONS.map((definition) => definition.key);

		expect(keys).toEqual(Object.keys(MANIFEST_OF));
		expect(new Set(keys).size).toBe(keys.length);
	});

	it.each(
		AUDIT_JOB_DEFINITIONS,
	)("matches the schedule of $key's manifest", (definition) => {
		const manifest = read(MANIFEST_OF[definition.key] as string);
		const schedule = /schedule:\s*"([^"]+)"/.exec(manifest)?.[1];

		expect(schedule).toBe(definition.cron);
	});

	it.each(
		AUDIT_JOB_DEFINITIONS,
	)("uses an audit action that exists in $key's contract", (definition) => {
		const actionKeys = read(
			"packages/app/src/modules/audit/shared/actionKeys.ts",
		);

		expect(actionKeys).toContain(`"${definition.action}"`);
	});

	// The registered key is not enough: the probe reads `audit.action_log`, so
	// something must actually append the line. A cleanup script that stopped
	// writing its trace would leave a critical probe red for good.
	const EMITTER_OF: Record<string, string> = {
		"system.declaration_cleanup": "packages/app/scripts/declaration-cleanup.ts",
		"system.audit_cleanup": "packages/app/scripts/audit-cleanup.ts",
	};

	it.each(
		Object.entries(EMITTER_OF),
	)("has an emitter writing %s to audit.action_log", (action, emitterPath) => {
		expect(read(emitterPath)).toContain(`"${action}"`);
	});
});
