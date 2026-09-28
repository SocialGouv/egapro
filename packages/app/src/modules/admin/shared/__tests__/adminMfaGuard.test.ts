import { describe, expect, it } from "vitest";
import {
	ADMIN_MFA_REQUIRED_MARKER,
	AdminMfaRequiredError,
	isAdminMfaRequiredErrorData,
} from "../adminMfaGuard";

describe("isAdminMfaRequiredErrorData", () => {
	it("returns true when the marker is set to true", () => {
		expect(
			isAdminMfaRequiredErrorData({ [ADMIN_MFA_REQUIRED_MARKER]: true }),
		).toBe(true);
	});

	it("returns false when the marker is set to false", () => {
		expect(
			isAdminMfaRequiredErrorData({ [ADMIN_MFA_REQUIRED_MARKER]: false }),
		).toBe(false);
	});

	it("returns false when the marker is absent", () => {
		expect(isAdminMfaRequiredErrorData({ code: "FORBIDDEN" })).toBe(false);
	});

	it("returns false for null, undefined and non-object data", () => {
		expect(isAdminMfaRequiredErrorData(null)).toBe(false);
		expect(isAdminMfaRequiredErrorData(undefined)).toBe(false);
		expect(isAdminMfaRequiredErrorData("adminMfaRequired")).toBe(false);
	});
});

describe("AdminMfaRequiredError", () => {
	it("carries the shared refusal message and a stable name", () => {
		const error = new AdminMfaRequiredError();
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe("AdminMfaRequiredError");
		expect(error.message).toContain("double authentification");
	});
});
