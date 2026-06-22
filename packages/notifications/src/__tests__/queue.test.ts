import { describe, expect, it } from "vitest";

import { validateJobData } from "../queue.js";

const VALID = {
	type: "joint_evaluation_submitted",
	payload: { siren: "552100554", year: 2025 },
	recipientEmail: "rh@example.fr",
	recipientUserId: "user-1",
	siren: "552100554",
};

describe("validateJobData", () => {
	it("accepts a well-formed payload", () => {
		const result = validateJobData(VALID);
		expect(result.ok).toBe(true);
	});

	it("accepts null recipientUserId and null siren", () => {
		const result = validateJobData({
			...VALID,
			recipientUserId: null,
			siren: null,
		});
		expect(result.ok).toBe(true);
	});

	it.each([null, undefined, 42, "string", []])("rejects %s", (value) => {
		const result = validateJobData(value);
		expect(result.ok).toBe(false);
	});

	it("rejects an unknown notification type", () => {
		const result = validateJobData({ ...VALID, type: "does_not_exist" });
		expect(result.ok).toBe(false);
		if (!result.ok)
			expect(result.reason).toContain("unknown notification type");
	});

	it("rejects a missing recipientEmail", () => {
		const result = validateJobData({ ...VALID, recipientEmail: "" });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.reason).toContain("recipientEmail");
	});

	it("rejects a malformed recipientEmail", () => {
		const result = validateJobData({ ...VALID, recipientEmail: "no-at-sign" });
		expect(result.ok).toBe(false);
	});

	it("rejects a payload missing siren/year", () => {
		const result = validateJobData({ ...VALID, payload: { foo: "bar" } });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.reason).toContain("siren");
	});

	it("accepts a well-formed attachments array", () => {
		const result = validateJobData({
			...VALID,
			attachments: [
				{
					filename: "receipt.pdf",
					contentBase64: "JVBERi0xLjQK",
					contentType: "application/pdf",
				},
			],
		});
		expect(result.ok).toBe(true);
	});

	it("rejects attachments that is not an array", () => {
		const result = validateJobData({ ...VALID, attachments: "nope" });
		expect(result.ok).toBe(false);
		if (!result.ok)
			expect(result.reason).toContain("attachments must be an array");
	});

	it("rejects an attachment missing filename", () => {
		const result = validateJobData({
			...VALID,
			attachments: [
				{ filename: "", contentBase64: "AA", contentType: "application/pdf" },
			],
		});
		expect(result.ok).toBe(false);
	});

	it("rejects an attachment missing contentBase64", () => {
		const result = validateJobData({
			...VALID,
			attachments: [
				{
					filename: "a.pdf",
					contentBase64: "",
					contentType: "application/pdf",
				},
			],
		});
		expect(result.ok).toBe(false);
	});

	it("rejects an attachment missing contentType", () => {
		const result = validateJobData({
			...VALID,
			attachments: [
				{ filename: "a.pdf", contentBase64: "AA", contentType: "" },
			],
		});
		expect(result.ok).toBe(false);
	});
});
