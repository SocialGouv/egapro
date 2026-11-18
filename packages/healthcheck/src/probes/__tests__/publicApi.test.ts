import { afterEach, describe, expect, it, vi } from "vitest";

import { createPublicApiProbe } from "../publicApi.js";

function probe(
	overrides: Partial<Parameters<typeof createPublicApiProbe>[0]> = {},
) {
	return createPublicApiProbe({
		publicUrl: "https://egapro.travail.gouv.fr",
		secrets: [],
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

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("public API probe", () => {
	it("declares itself as an important exposed probe", () => {
		expect(probe()).toMatchObject({
			key: "public-api",
			label: "API publique via l'ingress",
			criticality: "important",
			kind: "exposed",
			intervalSeconds: 300,
			timeoutMs: 10_000,
		});
	});

	it("is operational when the public API answers a JSON document", async () => {
		const fetchMock = stubFetch(jsonResponse({ openapi: "3.0.0" }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.latencyMs).toBeGreaterThanOrEqual(0);
		expect(fetchMock.mock.calls[0]?.[0]).toEqual(
			new URL("https://egapro.travail.gouv.fr/api/public/openapi.json"),
		);
	});

	it("is degraded when a 200 carries an HTML error page instead of JSON", async () => {
		stubFetch(
			new Response("<html>gateway</html>", {
				status: 200,
				headers: { "Content-Type": "text/html" },
			}),
		);

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("réponse non JSON");
	});

	it("is unavailable when the public API answers a server error", async () => {
		stubFetch(new Response("upstream exploded", { status: 503 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("l'API publique répond 503");
		expect(result.message).not.toContain("upstream");
	});

	it("is misconfigured when the public path does not exist", async () => {
		stubFetch(new Response("not found", { status: 404 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
		expect(result.message).toBe("l'API publique répond 404");
	});

	it("is unavailable and leaks no host when the public API cannot be reached", async () => {
		stubFetch(
			Object.assign(new Error("getaddrinfo ENOTFOUND egapro.internal"), {
				code: "ENOTFOUND",
			}),
		);

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("hôte introuvable");
		expect(result.message).not.toContain("egapro.internal");
	});

	it("is operational with 'non configuré' without a public URL", async () => {
		const result = await probe({ publicUrl: null }).probe(
			new AbortController().signal,
		);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});
