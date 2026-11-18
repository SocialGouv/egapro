import type { RedisClientType } from "redis";
import { describe, expect, it, vi } from "vitest";

import { createValkeyProbe } from "../valkey.js";

type FakeClient = {
	on: ReturnType<typeof vi.fn>;
	connect: ReturnType<typeof vi.fn>;
	ping: ReturnType<typeof vi.fn>;
	destroy: ReturnType<typeof vi.fn>;
};

function fakeClient(overrides: Partial<FakeClient> = {}): FakeClient {
	const client: FakeClient = {
		on: vi.fn(() => client),
		connect: vi.fn(async () => undefined),
		ping: vi.fn(async () => "PONG"),
		destroy: vi.fn(),
		...overrides,
	};
	return client;
}

function probeWith(client: FakeClient) {
	return createValkeyProbe({
		url: "redis://valkey:6379",
		secrets: [],
		createValkeyClient: () => client as unknown as RedisClientType,
	});
}

describe("valkey probe", () => {
	it("declares itself as a critical internal probe", () => {
		const probe = probeWith(fakeClient());

		expect(probe).toMatchObject({
			key: "valkey",
			label: "Valkey (cache et quotas)",
			criticality: "critical",
			kind: "internal",
			intervalSeconds: 60,
			timeoutMs: 5000,
		});
	});

	it("is operational when PING answers PONG", async () => {
		const client = fakeClient();
		const result = await probeWith(client).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.latencyMs).toBeGreaterThanOrEqual(0);
		expect(client.destroy).toHaveBeenCalledOnce();
	});

	it("is unavailable when the connection is refused", async () => {
		const client = fakeClient({
			connect: vi.fn(async () => {
				throw Object.assign(new Error("connect ECONNREFUSED 10.0.0.4:6379"), {
					code: "ECONNREFUSED",
				});
			}),
		});

		const result = await probeWith(client).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("connexion refusée");
		expect(result.message).not.toContain("10.0.0.4");
		expect(client.destroy).toHaveBeenCalledOnce();
	});

	it("is misconfigured when Valkey refuses the credentials", async () => {
		const client = fakeClient({
			connect: vi.fn(async () => {
				throw new Error("WRONGPASS invalid username-password pair");
			}),
		});

		const result = await probeWith(client).probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});

	it("is unavailable when PING answers something else", async () => {
		const client = fakeClient({ ping: vi.fn(async () => "PANG") });

		const result = await probeWith(client).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("réponse inattendue de Valkey");
	});

	it("is operational with 'non configuré' without VALKEY_URL", async () => {
		const result = await createValkeyProbe({
			url: null,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});
