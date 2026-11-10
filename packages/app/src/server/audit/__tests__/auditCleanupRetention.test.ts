import { describe, expect, it, vi } from "vitest";
import { resolveRetentionDays } from "#scripts/audit-cleanup";

vi.mock("~/modules/audit/shared/constants", () => ({
	AUDIT_RETENTION_DAYS_SHORT: 42,
	AUDIT_RETENTION_DAYS_LONG: 99,
	ADMIN_IMPERSONATION_RETENTION_DAYS: 77,
	SHORT_RETENTION_CATEGORIES: ["public_search"],
}));

describe("resolveRetentionDays", () => {
	it("falls back to the values of the audit constants when no override is set", () => {
		expect(resolveRetentionDays({})).toEqual({
			shortRetentionDays: 42,
			longRetentionDays: 99,
			impersonationRetentionDays: 77,
		});
	});

	it("treats an empty override as unset", () => {
		expect(
			resolveRetentionDays({
				EGAPRO_AUDIT_RETENTION_SHORT_DAYS: "",
				EGAPRO_AUDIT_RETENTION_LONG_DAYS: "",
				EGAPRO_ADMIN_IMPERSONATION_RETENTION_DAYS: "",
			}),
		).toEqual({
			shortRetentionDays: 42,
			longRetentionDays: 99,
			impersonationRetentionDays: 77,
		});
	});

	it("lets each environment variable override its default", () => {
		expect(
			resolveRetentionDays({
				EGAPRO_AUDIT_RETENTION_SHORT_DAYS: "30",
				EGAPRO_AUDIT_RETENTION_LONG_DAYS: "730",
				EGAPRO_ADMIN_IMPERSONATION_RETENTION_DAYS: "90",
			}),
		).toEqual({
			shortRetentionDays: 30,
			longRetentionDays: 730,
			impersonationRetentionDays: 90,
		});
	});

	it.each([
		["0"],
		["-5"],
		["1.5"],
		["abc"],
	])("rejects the invalid override %s", (raw) => {
		expect(() =>
			resolveRetentionDays({ EGAPRO_AUDIT_RETENTION_SHORT_DAYS: raw }),
		).toThrow(`Invalid retention value: "${raw}"`);
	});
});
