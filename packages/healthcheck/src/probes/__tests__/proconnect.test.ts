import { afterEach, describe, expect, it, vi } from "vitest";

import { createProconnectProbe } from "../proconnect.js";

const ISSUER = "https://proconnect.example.gouv.fr/api/v2";

const DISCOVERY = {
	authorization_endpoint: `${ISSUER}/authorize`,
	jwks_uri: `${ISSUER}/jwks`,
};

function probe(issuer: string | null = ISSUER) {
	return createProconnectProbe({
		issuer,
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

describe("proconnect probe", () => {
	it("declares itself as a critical partner probe", () => {
		expect(probe()).toMatchObject({
			key: "proconnect",
			label: "ProConnect (connexion)",
			criticality: "critical",
			kind: "partner",
			intervalSeconds: 900,
			timeoutMs: 5000,
		});
	});

	it("reads the well-known document of the configured issuer", async () => {
		const fetchMock = stubFetch(jsonResponse(DISCOVERY));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(fetchMock).toHaveBeenCalledWith(
			`${ISSUER}/.well-known/openid-configuration`,
			expect.anything(),
		);
	});

	it("tolerates a trailing slash on the issuer", async () => {
		const fetchMock = stubFetch(jsonResponse(DISCOVERY));

		await probe(`${ISSUER}/`).probe(new AbortController().signal);

		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			`${ISSUER}/.well-known/openid-configuration`,
		);
	});

	it("is misconfigured when the discovery document lacks jwks_uri", async () => {
		stubFetch(jsonResponse({ authorization_endpoint: `${ISSUER}/authorize` }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
		expect(result.message).toBe("document de découverte incomplet");
	});

	it("is unavailable when the issuer answers a server error", async () => {
		stubFetch(new Response("upstream down", { status: 503 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("le document de découverte répond 503");
	});

	it("is misconfigured when the discovery path does not exist", async () => {
		stubFetch(new Response("not found", { status: 404 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});

	it("is unavailable and leaks no host when the issuer cannot be reached", async () => {
		stubFetch(
			Object.assign(new Error("connect ECONNREFUSED 10.0.0.4:443"), {
				code: "ECONNREFUSED",
			}),
		);

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("connexion refusée");
		expect(result.message).not.toContain("10.0.0.4");
	});

	it("is operational with 'non configuré' without an issuer", async () => {
		const result = await probe(null).probe(new AbortController().signal);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});
