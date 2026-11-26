import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	init: vi.fn(),
	captureException: vi.fn(),
	flush: vi.fn(),
}));

vi.mock("@sentry/node", () => ({
	init: mocks.init,
	captureException: mocks.captureException,
	flush: mocks.flush,
}));

import {
	captureJobFailure,
	captureQueueConnectionFailure,
	flushWorkerSentry,
	initWorkerSentry,
} from "../sentry.js";

type Event = {
	request?: unknown;
	message?: string;
	exception?: { values?: Array<{ type?: string; value?: string }> };
	breadcrumbs?: Array<{ data?: Record<string, unknown>; message?: string }>;
};

function beforeSendOf(): (event: Event) => Event {
	initWorkerSentry({ dsn: "https://sentry.invalid/42", environment: "prod" });
	const options = mocks.init.mock.calls[0]?.[0] as {
		beforeSend: (event: Event) => Event;
	};
	return options.beforeSend;
}

describe("initWorkerSentry", () => {
	beforeEach(() => {
		mocks.init.mockReset();
		mocks.captureException.mockReset();
	});

	it("does nothing without a DSN", () => {
		initWorkerSentry({ dsn: undefined, environment: "dev" });

		expect(mocks.init).not.toHaveBeenCalled();
	});

	it("initialises the SDK without transaction sampling", () => {
		initWorkerSentry({
			dsn: "https://sentry.invalid/42",
			environment: "prod",
			release: "v1.2.3",
		});

		expect(mocks.init).toHaveBeenCalledWith(
			expect.objectContaining({
				dsn: "https://sentry.invalid/42",
				environment: "prod",
				release: "v1.2.3",
				tracesSampleRate: 0,
			}),
		);
	});
});

describe("worker beforeSend", () => {
	it("drops the request, the free-text message and every exception value", () => {
		const event: Event = {
			request: { headers: { authorization: "Bearer secret" } },
			message: "failed to send to [EMAIL_REDACTED]",
			exception: {
				values: [
					{
						type: "Error",
						value: "SMTP rejected [EMAIL_REDACTED] for SIREN 552100554",
					},
				],
			},
		};

		const scrubbed = beforeSendOf()(event);

		expect(scrubbed.request).toBeUndefined();
		expect(scrubbed.message).toBeUndefined();
		expect(scrubbed.exception?.values?.[0]).toEqual({
			type: "Error",
			value: "Error",
		});
	});

	it("keeps the exception type so failures stay groupable", () => {
		const event: Event = {
			exception: { values: [{ type: "TypeError", value: "x is undefined" }] },
		};

		const scrubbed = beforeSendOf()(event);

		expect(scrubbed.exception?.values?.[0]?.value).toBe("TypeError");
	});

	it("strips breadcrumb payloads and messages", () => {
		const event: Event = {
			breadcrumbs: [
				{ message: "smtp.send", data: { recipient: "jean@example.fr" } },
			],
		};

		const scrubbed = beforeSendOf()(event);

		expect(scrubbed.breadcrumbs?.[0]).toEqual({});
	});

	it("survives an event with no exception, no message nor breadcrumbs", () => {
		const event: Event = {};

		expect(() => beforeSendOf()(event)).not.toThrow();
		expect(beforeSendOf()(event)).toEqual({});
	});
});

describe("flushWorkerSentry", () => {
	beforeEach(() => {
		mocks.flush.mockReset();
	});

	it("flushes with the bounded timeout it was given", async () => {
		mocks.flush.mockResolvedValue(true);

		await expect(flushWorkerSentry(2000)).resolves.toBe(true);

		expect(mocks.flush).toHaveBeenCalledWith(2000);
	});

	it("resolves false when no client is initialised", async () => {
		mocks.flush.mockResolvedValue(false);

		await expect(flushWorkerSentry()).resolves.toBe(false);
	});
});

describe("captureJobFailure", () => {
	beforeEach(() => {
		mocks.captureException.mockReset();
	});

	it("groups transport failures under the smtp dependency", () => {
		const error = new Error("relay refused [EMAIL_REDACTED]");

		captureJobFailure(error, {
			attempt: 6,
			type: "receipt",
			phase: "transport",
		});

		expect(mocks.captureException).toHaveBeenCalledWith(error, {
			fingerprint: ["dependency", "smtp"],
			tags: { dependency: "smtp", phase: "transport" },
			extra: { attempt: 6, type: "receipt", phase: "transport" },
		});
	});

	it("groups render failures under the template engine", () => {
		captureJobFailure(new Error("template exploded"), {
			attempt: 6,
			type: "receipt",
			phase: "render",
		});

		const options = mocks.captureException.mock.calls[0]?.[1] as {
			fingerprint: string[];
		};
		expect(options.fingerprint).toEqual(["dependency", "mail-render"]);
	});

	it("wraps a non-Error rejection", () => {
		captureJobFailure("relay vanished", {
			attempt: 6,
			type: "receipt",
			phase: "transport",
		});

		const captured = mocks.captureException.mock.calls[0]?.[0] as Error;
		expect(captured).toBeInstanceOf(Error);
		expect(captured.message).toBe("relay vanished");
	});
});

describe("captureQueueConnectionFailure", () => {
	beforeEach(() => {
		mocks.captureException.mockReset();
	});

	it("reports the final queue connection failure once", () => {
		const error = new Error("ECONNREFUSED");

		captureQueueConnectionFailure(error, 5);

		expect(mocks.captureException).toHaveBeenCalledWith(error, {
			fingerprint: ["dependency", "queue"],
			tags: { dependency: "queue" },
			extra: { attempts: 5 },
		});
	});
});
