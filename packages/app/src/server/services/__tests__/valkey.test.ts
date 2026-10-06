import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	env: { VALKEY_URL: "" },
	createClient: vi.fn(),
}));

vi.mock("~/env", () => ({ env: mocks.env }));
vi.mock("redis", () => ({ createClient: mocks.createClient }));

function fakeClient(connect: () => Promise<unknown>) {
	const client = {
		isReady: false,
		on: vi.fn(),
		destroy: vi.fn(),
		connect: vi.fn(async () => {
			await connect();
			client.isReady = true;
		}),
	};
	return client;
}

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	mocks.env.VALKEY_URL = "";
});

describe("createValkeyConnection", () => {
	it("resolves to null without opening a client when Valkey is not configured", async () => {
		const { createValkeyConnection } = await import("../valkey");

		expect(await createValkeyConnection().client()).toBeNull();
		expect(mocks.createClient).not.toHaveBeenCalled();
	});

	it("reuses one ready client across calls", async () => {
		mocks.env.VALKEY_URL = "redis://valkey:6379";
		mocks.createClient.mockImplementation(() =>
			fakeClient(async () => undefined),
		);
		const { createValkeyConnection } = await import("../valkey");
		const connection = createValkeyConnection();

		const first = await connection.client();
		const second = await connection.client();

		expect(first).not.toBeNull();
		expect(second).toBe(first);
		expect(mocks.createClient).toHaveBeenCalledTimes(1);
	});

	it("resolves to null and destroys the client when the connection fails", async () => {
		mocks.env.VALKEY_URL = "redis://valkey:6379";
		const client = fakeClient(async () => {
			throw new Error("ECONNREFUSED");
		});
		mocks.createClient.mockReturnValue(client);
		const { createValkeyConnection } = await import("../valkey");

		expect(await createValkeyConnection().client()).toBeNull();
		expect(client.destroy).toHaveBeenCalledTimes(1);
	});

	it("reconnects after a discarded client", async () => {
		mocks.env.VALKEY_URL = "redis://valkey:6379";
		mocks.createClient.mockImplementation(() =>
			fakeClient(async () => undefined),
		);
		const { createValkeyConnection } = await import("../valkey");
		const connection = createValkeyConnection();
		const first = await connection.client();
		if (!first) throw new Error("expected a client");

		connection.discard(first);
		const second = await connection.client();

		expect(first.destroy).toHaveBeenCalledTimes(1);
		expect(second).not.toBe(first);
		expect(mocks.createClient).toHaveBeenCalledTimes(2);
	});

	it("gives each connection its own client", async () => {
		mocks.env.VALKEY_URL = "redis://valkey:6379";
		mocks.createClient.mockImplementation(() =>
			fakeClient(async () => undefined),
		);
		const { exportCacheValkey, rateLimitValkey } = await import("../valkey");

		const rateLimitClient = await rateLimitValkey.client();
		const cacheClient = await exportCacheValkey.client();
		if (!cacheClient) throw new Error("expected a client");
		exportCacheValkey.discard(cacheClient);

		expect(cacheClient).not.toBe(rateLimitClient);
		expect(rateLimitClient?.destroy).not.toHaveBeenCalled();
		expect(await rateLimitValkey.client()).toBe(rateLimitClient);
	});
});

describe("withValkeyTimeout", () => {
	it("rejects a command that outlives its deadline", async () => {
		const { withValkeyTimeout } = await import("../valkey");

		await expect(
			withValkeyTimeout(new Promise<never>(() => undefined), 5),
		).rejects.toThrow("Valkey command timeout");
	});

	it("passes a timely result through", async () => {
		const { withValkeyTimeout } = await import("../valkey");

		await expect(withValkeyTimeout(Promise.resolve("OK"), 1_000)).resolves.toBe(
			"OK",
		);
	});
});
