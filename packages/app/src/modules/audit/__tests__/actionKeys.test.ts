import { describe, expect, it } from "vitest";
import { AUDIT_ACTION_CATEGORIES, AUDIT_ACTIONS } from "../shared/actionKeys";
import {
	AUDIT_RETENTION_DAYS_LONG,
	AUDIT_RETENTION_DAYS_SHORT,
	SHORT_RETENTION_CATEGORIES,
} from "../shared/constants";

describe("AUDIT_ACTIONS", () => {
	it("maps every action key to a category", () => {
		const actionKeys = Object.values(AUDIT_ACTIONS);
		for (const key of actionKeys) {
			expect(AUDIT_ACTION_CATEGORIES[key]).toBeDefined();
		}
	});

	it("uses unique action key strings", () => {
		const values = Object.values(AUDIT_ACTIONS);
		expect(new Set(values).size).toBe(values.length);
	});

	it("maps the lock-timeout admin setting update to a mutation", () => {
		expect(AUDIT_ACTIONS.ADMIN_SETTINGS_UPDATE_LOCK_TIMEOUT).toBe(
			"admin_settings.update_lock_timeout",
		);
		expect(
			AUDIT_ACTION_CATEGORIES[AUDIT_ACTIONS.ADMIN_SETTINGS_UPDATE_LOCK_TIMEOUT],
		).toBe("mutation");
	});

	it("maps the declaration lock state read to a sensitive read (holder PII)", () => {
		expect(AUDIT_ACTIONS.DECLARATION_LOCK_STATE_READ).toBe(
			"declaration.lock_state_read",
		);
		expect(
			AUDIT_ACTION_CATEGORIES[AUDIT_ACTIONS.DECLARATION_LOCK_STATE_READ],
		).toBe("read_sensitive");
	});

	it("maps the public declarations export to the export category (365-day retention)", () => {
		expect(AUDIT_ACTIONS.PUBLIC_DECLARATIONS_EXPORT).toBe(
			"public_declarations.export",
		);
		expect(
			AUDIT_ACTION_CATEGORIES[AUDIT_ACTIONS.PUBLIC_DECLARATIONS_EXPORT],
		).toBe("export");
	});
});

describe("retention constants", () => {
	it("short retention is shorter than long retention", () => {
		expect(AUDIT_RETENTION_DAYS_SHORT).toBeLessThan(AUDIT_RETENTION_DAYS_LONG);
	});

	it("CNIL recommendation: short = 6 months, long = 12 months", () => {
		expect(AUDIT_RETENTION_DAYS_SHORT).toBe(180);
		expect(AUDIT_RETENTION_DAYS_LONG).toBe(365);
	});

	it("read_sensitive falls into the short retention bucket", () => {
		expect(SHORT_RETENTION_CATEGORIES).toContain("read_sensitive");
	});

	it("public_search falls into the short retention bucket", () => {
		expect(SHORT_RETENTION_CATEGORIES).toContain("public_search");
	});
});

describe("public_search category", () => {
	it("maps public referent actions to public_search", () => {
		expect(AUDIT_ACTION_CATEGORIES[AUDIT_ACTIONS.PUBLIC_REFERENT_SEARCH]).toBe(
			"public_search",
		);
		expect(AUDIT_ACTION_CATEGORIES[AUDIT_ACTIONS.PUBLIC_REFERENT_VIEW]).toBe(
			"public_search",
		);
	});
});
