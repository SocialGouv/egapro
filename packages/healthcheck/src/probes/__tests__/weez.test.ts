import { afterEach, describe, expect, it, vi } from "vitest";

import { createWeezProbe } from "../weez.js";

const REFERENCE_SIREN = "130025265";
const API_URL = "https://weez.example.gouv.fr/api";

function probe(
	connection = { apiUrl: API_URL, referenceSiren: REFERENCE_SIREN },
) {
	return createWeezProbe({
		connection,
		secrets: [],
		intervalSeconds: 900,
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

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("weez probe", () => {
	it("declares itself as an important partner probe", () => {
		expect(probe()).toMatchObject({
			key: "weez",
			label: "WEEZ (registre Sirene)",
			criticality: "important",
			kind: "partner",
			intervalSeconds: 900,
			timeoutMs: 10_000,
		});
	});

	it("is operational when the reference SIREN comes back", async () => {
		const fetchMock = stubFetch(
			jsonResponse({ content: [{ siren: REFERENCE_SIREN }] }),
		);

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.latencyMs).toBeGreaterThanOrEqual(0);

		const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
		expect(url.pathname).toBe("/api/public/v3/unitelegale/findbysiren");
		expect(url.searchParams.get("siren")).toBe(REFERENCE_SIREN);
		expect(init.cache).toBe("no-store");
		expect(init).not.toHaveProperty("next");
	});

	it("is misconfigured when the payload has no entity", async () => {
		stubFetch(jsonResponse({ content: [] }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
		expect(result.message).toBe("réponse WEEZ sans le SIREN de référence");
	});

	it("is misconfigured when the payload carries another SIREN", async () => {
		stubFetch(jsonResponse({ content: [{ siren: "123456789" }] }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});

	it("is unavailable when the registry answers a server error", async () => {
		stubFetch(new Response("upstream down", { status: 502 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("l'API WEEZ répond 502");
	});

	it("is unavailable and leaks no host when the registry cannot be reached", async () => {
		stubFetch(
			Object.assign(new Error("getaddrinfo ENOTFOUND weez.internal"), {
				code: "ENOTFOUND",
			}),
		);

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("hôte introuvable");
		expect(result.message).not.toContain("weez.internal");
	});

	it("is operational with 'non configuré' without a target", async () => {
		const result = await createWeezProbe({
			connection: null,
			secrets: [],
			intervalSeconds: 900,
		}).probe(new AbortController().signal);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});
