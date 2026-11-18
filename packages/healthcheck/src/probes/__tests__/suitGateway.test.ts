import { afterEach, describe, expect, it, vi } from "vitest";

import { createSuitGatewayProbe } from "../suitGateway.js";

const API_KEY = "supervision-secret-key";

function probe(
	overrides: Partial<Parameters<typeof createSuitGatewayProbe>[0]> = {},
) {
	return createSuitGatewayProbe({
		connection: {
			baseUrl: "https://api-suit-egapro.travail.gouv.fr",
			apiKey: API_KEY,
		},
		secrets: [API_KEY],
		intervalSeconds: 300,
		...overrides,
	});
}

function stubFetch(response: Response | Error) {
	const mock = vi.fn(async () => {
		if (response instanceof Error) throw response;
		return response;
	});
	vi.stubGlobal("fetch", mock);
	return mock;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("SUIT gateway probe", () => {
	it("declares itself as an important exposed probe", () => {
		expect(probe()).toMatchObject({
			key: "suit-gateway",
			label: "Passerelle SUIT (APISIX)",
			criticality: "important",
			kind: "exposed",
			intervalSeconds: 300,
			timeoutMs: 10_000,
		});
	});

	it("calls the health route through APISIX with the supervision consumer key", async () => {
		const fetchMock = stubFetch(new Response("OK", { status: 200 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.latencyMs).toBeGreaterThanOrEqual(0);

		const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
		expect(url.toString()).toBe(
			"https://api-suit-egapro.travail.gouv.fr/api/v1/healthz",
		);
		expect((init.headers as Record<string, string>).Authorization).toBe(
			`Bearer ${API_KEY}`,
		);
	});

	it("is misconfigured when the consumer key is refused", async () => {
		stubFetch(new Response("unauthorized", { status: 401 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
		expect(result.message).toBe("clé du consumer de supervision refusée");
	});

	it("is misconfigured when the consumer is forbidden", async () => {
		stubFetch(new Response("forbidden", { status: 403 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
		expect(result.message).toBe("clé du consumer de supervision refusée");
	});

	it("is unavailable when APISIX cannot reach the upstream", async () => {
		stubFetch(new Response("bad gateway", { status: 502 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("la passerelle SUIT répond 502");
	});

	it("is misconfigured when APISIX has no route for the health path", async () => {
		stubFetch(new Response("not found", { status: 404 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
		expect(result.message).toBe("la passerelle SUIT répond 404");
	});

	it("never stores the consumer key when the gateway cannot be reached", async () => {
		stubFetch(
			Object.assign(new Error("connect ECONNREFUSED 10.0.0.9:443"), {
				code: "ECONNREFUSED",
			}),
		);

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("connexion refusée");
		expect(result.message).not.toContain(API_KEY);
		expect(result.message).not.toContain("10.0.0.9");
	});

	it("is operational with 'non configuré' without a target", async () => {
		const result = await probe({ connection: null }).probe(
			new AbortController().signal,
		);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});
