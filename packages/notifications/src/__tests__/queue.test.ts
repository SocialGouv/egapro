import { describe, expect, it } from "vitest";

import { validateJobData } from "../queue.js";

const VALID = {
	type: "joint_evaluation_submitted",
	payload: {
		siren: "552100554",
		year: 2025,
		variant: "completed",
		raisonSociale: "Société Démo",
	},
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

const buildConfirmation = (type: string, payload: Record<string, unknown>) => ({
	type,
	payload,
	recipientEmail: "rh@example.fr",
	recipientUserId: "user-1",
	siren: "552100554",
});

const BASE_SCOPE = { siren: "552100554", year: 2025 } as const;

describe("validateJobData — confirmation variants", () => {
	const DECLARATION_TYPES = [
		"declaration_confirmation",
		"second_declaration_confirmation",
	] as const;

	describe.each(DECLARATION_TYPES)("%s", (type) => {
		it("accepts a valid completed payload", () => {
			const result = validateJobData(
				buildConfirmation(type, {
					...BASE_SCOPE,
					variant: "completed",
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(true);
		});

		it("accepts a valid path_to_select payload with a complianceDeadline", () => {
			const result = validateJobData(
				buildConfirmation(type, {
					...BASE_SCOPE,
					variant: "path_to_select",
					raisonSociale: "Société Démo",
					complianceDeadline: "2025-09-01T00:00:00.000Z",
				}),
			);
			expect(result.ok).toBe(true);
		});

		it("rejects a payload without variant", () => {
			const result = validateJobData(
				buildConfirmation(type, {
					...BASE_SCOPE,
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("variant");
		});

		it("rejects a variant outside the union", () => {
			const result = validateJobData(
				buildConfirmation(type, {
					...BASE_SCOPE,
					variant: "with_gap",
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("variant");
		});

		it("rejects an empty raisonSociale", () => {
			const result = validateJobData(
				buildConfirmation(type, {
					...BASE_SCOPE,
					variant: "completed",
					raisonSociale: "",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("raisonSociale");
		});

		it("rejects a missing raisonSociale", () => {
			const result = validateJobData(
				buildConfirmation(type, { ...BASE_SCOPE, variant: "completed" }),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("raisonSociale");
		});

		it("rejects a path_to_select variant missing complianceDeadline", () => {
			const result = validateJobData(
				buildConfirmation(type, {
					...BASE_SCOPE,
					variant: "path_to_select",
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("complianceDeadline");
		});

		it("rejects a path_to_select variant with an empty complianceDeadline", () => {
			const result = validateJobData(
				buildConfirmation(type, {
					...BASE_SCOPE,
					variant: "path_to_select",
					raisonSociale: "Société Démo",
					complianceDeadline: "",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("complianceDeadline");
		});

		it("rejects a payload missing siren/year", () => {
			const result = validateJobData(
				buildConfirmation(type, {
					variant: "completed",
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("siren");
		});
	});

	describe("joint_evaluation_submitted", () => {
		it.each([
			"completed",
			"cse_to_deposit",
			"cse_first_and_second",
		])("accepts the %s variant", (variant) => {
			const result = validateJobData(
				buildConfirmation("joint_evaluation_submitted", {
					...BASE_SCOPE,
					variant,
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(true);
		});

		it("rejects a payload without variant", () => {
			const result = validateJobData(
				buildConfirmation("joint_evaluation_submitted", {
					...BASE_SCOPE,
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("variant");
		});

		it("rejects a variant outside the union", () => {
			const result = validateJobData(
				buildConfirmation("joint_evaluation_submitted", {
					...BASE_SCOPE,
					variant: "path_to_select",
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("variant");
		});

		it("rejects an empty raisonSociale", () => {
			const result = validateJobData(
				buildConfirmation("joint_evaluation_submitted", {
					...BASE_SCOPE,
					variant: "completed",
					raisonSociale: "",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("raisonSociale");
		});

		it("rejects a payload missing siren/year", () => {
			const result = validateJobData(
				buildConfirmation("joint_evaluation_submitted", {
					variant: "completed",
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("siren");
		});
	});

	describe("cse_opinion_receipt", () => {
		it.each([
			"single",
			"with_gap",
			"first_and_second",
		])("accepts the %s variant", (variant) => {
			const result = validateJobData(
				buildConfirmation("cse_opinion_receipt", {
					...BASE_SCOPE,
					variant,
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(true);
		});

		it("rejects a payload without variant", () => {
			const result = validateJobData(
				buildConfirmation("cse_opinion_receipt", {
					...BASE_SCOPE,
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("variant");
		});

		it("rejects a variant outside the union", () => {
			const result = validateJobData(
				buildConfirmation("cse_opinion_receipt", {
					...BASE_SCOPE,
					variant: "completed",
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("variant");
		});

		it("rejects an empty raisonSociale", () => {
			const result = validateJobData(
				buildConfirmation("cse_opinion_receipt", {
					...BASE_SCOPE,
					variant: "single",
					raisonSociale: "",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("raisonSociale");
		});

		it("rejects a payload missing siren/year", () => {
			const result = validateJobData(
				buildConfirmation("cse_opinion_receipt", {
					variant: "single",
					raisonSociale: "Société Démo",
				}),
			);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.reason).toContain("siren");
		});
	});
});
