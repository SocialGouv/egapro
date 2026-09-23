import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	replayPendingReceipts: vi.fn(),
}));

vi.mock("~/server/audit/withAuditedRoute", () => ({
	withAuditedRoute: (
		_options: unknown,
		handler: (request: Request) => Promise<Response>,
	) => handler,
}));

vi.mock("~/modules/mail/server", () => ({
	replayPendingReceipts: mocks.replayPendingReceipts,
}));

import { POST } from "../route";

function buildRequest(headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/receipts/retry", {
		method: "POST",
		headers,
	});
}

describe("POST /api/receipts/retry", () => {
	it("rejects a request with no X-Gateway-Forwarded header, without replaying anything", async () => {
		mocks.replayPendingReceipts.mockClear();

		const res = await POST(buildRequest());

		expect(res.status).toBe(403);
		expect(mocks.replayPendingReceipts).not.toHaveBeenCalled();
	});

	it("replays pending receipts once the gateway header is present", async () => {
		mocks.replayPendingReceipts.mockClear();
		mocks.replayPendingReceipts.mockResolvedValue({
			claimed: 2,
			sent: 2,
			failed: 0,
		});

		const res = await POST(
			buildRequest({
				"x-gateway-forwarded": "whatever-the-middleware-let-through",
			}),
		);

		expect(res.status).toBe(200);
		expect(mocks.replayPendingReceipts).toHaveBeenCalledTimes(1);
		await expect(res.json()).resolves.toEqual({
			success: true,
			claimed: 2,
			sent: 2,
			failed: 0,
		});
	});
});
