import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	enqueueNotification: vi.fn(),
	logAction: vi.fn(),
	buildDeclarationAttachments: vi.fn(),
	buildSecondDeclarationAttachments: vi.fn(),
	getCampaignDeadlines: vi.fn(),
	dbResults: [] as unknown[][],
	limit: vi.fn(),
}));

vi.mock("notifications/publisher", () => ({
	enqueueNotification: mocks.enqueueNotification,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

vi.mock("../buildReceiptAttachments", () => ({
	buildDeclarationAttachments: mocks.buildDeclarationAttachments,
	buildSecondDeclarationAttachments: mocks.buildSecondDeclarationAttachments,
}));

vi.mock("~/server/db/getCampaignDeadlines", () => ({
	getCampaignDeadlines: mocks.getCampaignDeadlines,
}));

vi.mock("~/server/db", () => ({
	db: {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => Promise.resolve(mocks.dbResults.shift() ?? []),
				}),
			}),
		}),
	},
}));

import { AUDIT_ACTIONS } from "~/modules/audit";
import { enqueueReceipt } from "../enqueueReceipt";

const PDF_ATTACHMENT = {
	filename: "test.pdf",
	content: Buffer.from("pdf"),
	contentType: "application/pdf",
};

const baseInput = {
	to: "user@example.com",
	siren: "552100554",
	year: 2025,
	userId: "user-1",
	isResend: false,
};

const declarationRow = {
	status: "declared",
	cseRequired: false,
	secondDeclarationStep: null,
	firstDeclarationPathChoice: null,
	secondDeclarationPathChoice: null,
};

const companyRow = { name: "Société Démo" };

function stubContext(
	row: Record<string, unknown> | null = declarationRow,
	company: Record<string, unknown> | null = companyRow,
) {
	mocks.dbResults = [row ? [row] : [], company ? [company] : []];
}

describe("enqueueReceipt", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.buildDeclarationAttachments.mockResolvedValue([PDF_ATTACHMENT]);
		mocks.buildSecondDeclarationAttachments.mockResolvedValue([PDF_ATTACHMENT]);
		mocks.getCampaignDeadlines.mockResolvedValue({
			pathChoiceDeadline: new Date("2025-09-01T00:00:00.000Z"),
		});
		mocks.enqueueNotification.mockResolvedValue({
			status: "enqueued",
			id: "job-1",
		});
		stubContext();
	});

	it("enqueues a declaration confirmation with PDF attachments and logs success", async () => {
		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(mocks.buildDeclarationAttachments).toHaveBeenCalledWith(
			"552100554",
			2025,
		);
		expect(mocks.enqueueNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "declaration_confirmation",
				recipientEmail: "user@example.com",
				recipientUserId: "user-1",
				siren: "552100554",
				payload: {
					siren: "552100554",
					year: 2025,
					raisonSociale: "Société Démo",
					variant: "completed",
				},
				attachments: [PDF_ATTACHMENT],
			}),
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
				status: "success",
				resourceType: "notification",
				resourceId: "job-1",
				userId: "user-1",
				userEmail: "user@example.com",
				siren: "552100554",
				metadata: expect.objectContaining({
					type: "declaration_confirmation",
					kind: "declaration",
					year: 2025,
					isResend: false,
					variant: "completed",
				}),
			}),
		);
	});

	it("maps secondDeclaration to second_declaration_confirmation", async () => {
		await enqueueReceipt({ ...baseInput, kind: "secondDeclaration" });

		expect(mocks.buildSecondDeclarationAttachments).toHaveBeenCalledWith(
			"552100554",
			2025,
		);
		expect(mocks.enqueueNotification).toHaveBeenCalledWith(
			expect.objectContaining({ type: "second_declaration_confirmation" }),
		);
	});

	it("maps cseOpinion to cse_opinion_receipt without attachments", async () => {
		await enqueueReceipt({ ...baseInput, kind: "cseOpinion" });

		expect(mocks.buildDeclarationAttachments).not.toHaveBeenCalled();
		expect(mocks.buildSecondDeclarationAttachments).not.toHaveBeenCalled();
		expect(mocks.enqueueNotification).toHaveBeenCalledWith(
			expect.objectContaining({ type: "cse_opinion_receipt" }),
		);
		const call = mocks.enqueueNotification.mock.calls[0]?.[0] as {
			attachments?: unknown;
		};
		expect(call.attachments).toBeUndefined();
	});

	it("maps jointEvaluation to joint_evaluation_submitted without attachments", async () => {
		await enqueueReceipt({ ...baseInput, kind: "jointEvaluation" });

		expect(mocks.buildDeclarationAttachments).not.toHaveBeenCalled();
		expect(mocks.buildSecondDeclarationAttachments).not.toHaveBeenCalled();
		expect(mocks.enqueueNotification).toHaveBeenCalledWith(
			expect.objectContaining({ type: "joint_evaluation_submitted" }),
		);
		const call = mocks.enqueueNotification.mock.calls[0]?.[0] as {
			attachments?: unknown;
		};
		expect(call.attachments).toBeUndefined();
	});

	it("logs failure with errorMessage when publisher returns error", async () => {
		mocks.enqueueNotification.mockResolvedValue({
			status: "error",
			error: "connection refused",
		});

		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
				status: "failure",
				errorMessage: "connection refused",
			}),
		);
	});

	it("logs failure with queue_unavailable when publisher cannot reach the queue", async () => {
		mocks.enqueueNotification.mockResolvedValue({
			status: "queue_unavailable",
		});

		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "failure",
				errorMessage: "queue_unavailable",
			}),
		);
	});

	it("logs failure and swallows the exception when attachment build throws", async () => {
		mocks.buildDeclarationAttachments.mockRejectedValue(
			new Error("pdf rendering failed"),
		);

		await expect(
			enqueueReceipt({ ...baseInput, kind: "declaration" }),
		).resolves.toBeUndefined();

		expect(mocks.enqueueNotification).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
				status: "failure",
				errorMessage: "pdf rendering failed",
			}),
		);
	});

	it("logs failure with a generic message when a non-Error value is thrown", async () => {
		mocks.buildDeclarationAttachments.mockRejectedValue("boom");

		await expect(
			enqueueReceipt({ ...baseInput, kind: "declaration" }),
		).resolves.toBeUndefined();

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "failure",
				errorMessage: "Unknown error",
			}),
		);
	});

	it("passes a null userId through when the session has no user id", async () => {
		await enqueueReceipt({
			...baseInput,
			userId: null,
			kind: "declaration",
		});

		expect(mocks.enqueueNotification).toHaveBeenCalledWith(
			expect.objectContaining({ recipientUserId: null }),
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ userId: null }),
		);
	});
});

describe("enqueueReceipt — variant derivation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.buildDeclarationAttachments.mockResolvedValue([PDF_ATTACHMENT]);
		mocks.buildSecondDeclarationAttachments.mockResolvedValue([PDF_ATTACHMENT]);
		mocks.getCampaignDeadlines.mockResolvedValue({
			pathChoiceDeadline: new Date("2025-09-01T00:00:00.000Z"),
		});
		mocks.enqueueNotification.mockResolvedValue({
			status: "enqueued",
			id: "job-1",
		});
	});

	const payloadOf = () =>
		mocks.enqueueNotification.mock.calls[0]?.[0].payload as Record<
			string,
			unknown
		>;

	it("selects cse_to_deposit for a declaration when the CSE is required and there is no gap", async () => {
		stubContext({ ...declarationRow, cseRequired: true });

		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(payloadOf().variant).toBe("cse_to_deposit");
		expect(payloadOf().complianceDeadline).toBeUndefined();
		expect(mocks.getCampaignDeadlines).not.toHaveBeenCalled();
	});

	it("selects path_to_select and attaches the compliance deadline when a compliance path was chosen", async () => {
		stubContext({
			...declarationRow,
			firstDeclarationPathChoice: "justify",
		});

		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(payloadOf().variant).toBe("path_to_select");
		expect(payloadOf().complianceDeadline).toBe("2025-09-01T00:00:00.000Z");
		expect(mocks.getCampaignDeadlines).toHaveBeenCalledWith(2025);
	});

	it("treats an awaiting_compliance_path_choice status as a gap above the threshold", async () => {
		stubContext({
			...declarationRow,
			status: "awaiting_compliance_path_choice",
		});

		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(payloadOf().variant).toBe("path_to_select");
	});

	it("treats an awaiting_revision_choice status as a gap above the threshold", async () => {
		stubContext({
			...declarationRow,
			status: "awaiting_revision_choice",
		});

		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(payloadOf().variant).toBe("path_to_select");
	});

	it("selects cse_first_and_second for a joint evaluation when a second declaration exists", async () => {
		stubContext({ ...declarationRow, secondDeclarationStep: 3 });

		await enqueueReceipt({ ...baseInput, kind: "jointEvaluation" });

		expect(payloadOf().variant).toBe("cse_first_and_second");
	});

	it("selects cse_to_deposit for a joint evaluation when the CSE is required without a second declaration", async () => {
		stubContext({ ...declarationRow, cseRequired: true });

		await enqueueReceipt({ ...baseInput, kind: "jointEvaluation" });

		expect(payloadOf().variant).toBe("cse_to_deposit");
	});

	it("selects completed for a joint evaluation with neither a second declaration nor a required CSE", async () => {
		stubContext();

		await enqueueReceipt({ ...baseInput, kind: "jointEvaluation" });

		expect(payloadOf().variant).toBe("completed");
	});

	it("selects first_and_second for a cse opinion receipt when a second declaration exists", async () => {
		stubContext({
			...declarationRow,
			secondDeclarationPathChoice: "corrective_action",
		});

		await enqueueReceipt({ ...baseInput, kind: "cseOpinion" });

		expect(payloadOf().variant).toBe("first_and_second");
	});

	it("selects with_gap for a cse opinion receipt when there is a gap for a single declaration", async () => {
		stubContext({
			...declarationRow,
			status: "awaiting_compliance_path_choice",
		});

		await enqueueReceipt({ ...baseInput, kind: "cseOpinion" });

		expect(payloadOf().variant).toBe("with_gap");
	});

	it("selects single for a cse opinion receipt with no gap and a single declaration", async () => {
		stubContext();

		await enqueueReceipt({ ...baseInput, kind: "cseOpinion" });

		expect(payloadOf().variant).toBe("single");
	});

	it("falls back to a neutral context and the siren as raisonSociale when no declaration and no company are found", async () => {
		stubContext(null, null);

		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(payloadOf().variant).toBe("completed");
		expect(payloadOf().raisonSociale).toBe("552100554");
	});

	it("falls back to the siren as raisonSociale when the company row has a null name", async () => {
		stubContext(declarationRow, { name: null });

		await enqueueReceipt({ ...baseInput, kind: "declaration" });

		expect(payloadOf().raisonSociale).toBe("552100554");
	});
});
