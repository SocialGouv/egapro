import { describe, expect, it } from "vitest";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { projectAuditMetadata } from "../metadata";

describe("projectAuditMetadata", () => {
	it("keeps the format and the campaign year of the public representation export", () => {
		expect(
			projectAuditMetadata(AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_EXPORT, {
				format: "csv",
				year: 2027,
				search: "Société Démo",
			}),
		).toEqual({ format: "csv", year: 2027 });
	});

	it("drops both fields when their values fall outside their closed shape", () => {
		expect(
			projectAuditMetadata(AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_EXPORT, {
				format: "pdf",
				year: "campagne",
			}),
		).toBeNull();
	});
});
