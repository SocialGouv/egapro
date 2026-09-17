import { describe, expect, it } from "vitest";
import {
	getSubmissionErrorMessage,
	SUBMISSION_UNCONFIRMED_MESSAGE,
} from "../submissionErrorMessage";

describe("getSubmissionErrorMessage", () => {
	it("returns null when there is no error", () => {
		expect(getSubmissionErrorMessage(null)).toBeNull();
	});

	it.each([
		[
			"FORBIDDEN",
			"La date limite de modification de la déclaration est dépassée.",
		],
		["CONFLICT", "Cette déclaration est en cours de modification."],
	])("keeps the server message written for the user (%s)", (code, message) => {
		expect(getSubmissionErrorMessage({ message, data: { code } })).toBe(
			message,
		);
	});

	it("hides a rules-engine refusal behind the generic message", () => {
		expect(
			getSubmissionErrorMessage({
				message:
					'No matching transition for state="awaiting_compliance_path_choice" action="submit". Facts: {}',
				data: { code: "INTERNAL_SERVER_ERROR" },
			}),
		).toBe(SUBMISSION_UNCONFIRMED_MESSAGE);
	});

	it("uses the generic message for an error without a code", () => {
		expect(
			getSubmissionErrorMessage({ message: "UNAUTHORIZED", data: null }),
		).toBe(SUBMISSION_UNCONFIRMED_MESSAGE);
	});

	it("uses the generic message for a network failure", () => {
		expect(getSubmissionErrorMessage({ message: "Failed to fetch" })).toBe(
			SUBMISSION_UNCONFIRMED_MESSAGE,
		);
	});
});
