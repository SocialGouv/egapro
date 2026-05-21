import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	enqueueNotification: vi.fn(),
	logAction: vi.fn(),
	buildDeclarationAttachments: vi.fn(),
	buildSecondDeclarationAttachments: vi.fn(),
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

describe("enqueueReceipt", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.buildDeclarationAttachments.mockResolvedValue([PDF_ATTACHMENT]);
		mocks.buildSecondDeclarationAttachments.mockResolvedValue([PDF_ATTACHMENT]);
	});

	it("enqueues a declaration confirmation with PDF attachments and logs success", async () => {
		mocks.enqueueNotification.mockResolvedValue({
			status: "enqueued",
			id: "job-1",
		});

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
				payload: { siren: "552100554", year: 2025 },
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
				}),
			}),
		);
	});

	it("maps secondDeclaration to second_declaration_confirmation", async () => {
		mocks.enqueueNotification.mockResolvedValue({
			status: "enqueued",
			id: "job-2",
		});

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
		mocks.enqueueNotification.mockResolvedValue({
			status: "enqueued",
			id: "job-3",
		});

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

	it("passes a null userId through when the session has no user id", async () => {
		mocks.enqueueNotification.mockResolvedValue({
			status: "enqueued",
			id: "job-4",
		});

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
