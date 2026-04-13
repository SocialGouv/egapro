import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogAction = vi.fn();
vi.mock("../log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

const { withAuditedRoute } = await import("../withAuditedRoute");
const { AUDIT_ACTIONS } = await import("~/modules/audit");

function buildRequest() {
	return new Request("http://localhost/api/test", {
		headers: {
			"x-forwarded-for": "203.0.113.99",
			"user-agent": "RouteAgent",
		},
	});
}

describe("withAuditedRoute", () => {
	beforeEach(() => {
		mockLogAction.mockClear();
	});

	it("logs success when the handler returns a 2xx response", async () => {
		const handler = withAuditedRoute(
			{ action: AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD },
			async () => new Response("ok", { status: 200 }),
		);

		const response = await handler(buildRequest());
		expect(response.status).toBe(200);
		expect(mockLogAction).toHaveBeenCalledOnce();
		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "pdf.declaration_download",
			status: "success",
			ipAddress: "203.0.113.99",
			userAgent: "RouteAgent",
		});
	});

	it("logs failure when the handler returns a non-2xx response", async () => {
		const handler = withAuditedRoute(
			{ action: AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD },
			async () => new Response("nope", { status: 401 }),
		);

		const response = await handler(buildRequest());
		expect(response.status).toBe(401);
		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			status: "failure",
			errorMessage: "HTTP 401",
		});
	});

	it("logs failure and re-throws when the handler throws", async () => {
		const error = new Error("boom");
		const handler = withAuditedRoute(
			{ action: AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD },
			async () => {
				throw error;
			},
		);

		await expect(handler(buildRequest())).rejects.toBe(error);
		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			status: "failure",
			errorMessage: "boom",
		});
	});

	it("merges audit context returned by resolveContext", async () => {
		const handler = withAuditedRoute(
			{
				action: AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD,
				resolveContext: () => ({
					userId: "user-1",
					userEmail: "u@example.com",
					siren: "123456789",
					metadata: { year: 2026 },
				}),
			},
			async () => new Response(null, { status: 200 }),
		);

		await handler(buildRequest());
		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			userId: "user-1",
			userEmail: "u@example.com",
			siren: "123456789",
			metadata: { year: 2026 },
		});
	});

	it("does not propagate resolveContext errors", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const handler = withAuditedRoute(
			{
				action: AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD,
				resolveContext: () => {
					throw new Error("session lookup failed");
				},
			},
			async () => new Response(null, { status: 200 }),
		);

		const response = await handler(buildRequest());
		expect(response.status).toBe(200);
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
