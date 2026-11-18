import { afterEach, describe, expect, it, vi } from "vitest";

import { createIngressProbe } from "../ingress.js";

const NOW = new Date("2026-11-18T00:00:00Z");

function probe(
	overrides: Partial<Parameters<typeof createIngressProbe>[0]> = {},
) {
	return createIngressProbe({
		publicUrl: "https://egapro.travail.gouv.fr",
		secrets: [],
		intervalSeconds: 300,
		certWarnDays: 30,
		now: () => NOW,
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

function daysFromNow(days: number): Date {
	return new Date(NOW.getTime() + days * 86_400_000);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("ingress probe", () => {
	it("declares itself as a critical exposed probe", () => {
		expect(probe()).toMatchObject({
			key: "ingress",
			label: "Application via l'ingress public",
			criticality: "critical",
			kind: "exposed",
			intervalSeconds: 300,
			timeoutMs: 10_000,
		});
	});

	it("is operational when the ingress answers 200 and the certificate is far", async () => {
		const fetchMock = stubFetch(new Response("<html></html>", { status: 200 }));

		const result = await probe({
			readCertificate: async () => ({ validTo: daysFromNow(90) }),
		}).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.latencyMs).toBeGreaterThanOrEqual(0);
		expect(result.message).toBeUndefined();
		expect(fetchMock.mock.calls[0]?.[0]).toEqual(
			new URL("https://egapro.travail.gouv.fr/"),
		);
	});

	it("accepts a redirect without following it", async () => {
		const fetchMock = stubFetch(
			new Response(null, { status: 302, headers: { Location: "/login" } }),
		);

		const result = await probe({
			readCertificate: async () => null,
		}).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			redirect: "manual",
		});
	});

	it("is unavailable when the ingress answers 502, and never stores the body", async () => {
		stubFetch(new Response("upstream exploded", { status: 502 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("l'ingress répond 502");
		expect(result.message).not.toContain("upstream");
	});

	it("is degraded when the ingress answers 404", async () => {
		stubFetch(new Response("not found", { status: 404 }));

		const result = await probe().probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("l'ingress répond 404");
	});

	it("is degraded when the certificate expires within the warning window", async () => {
		stubFetch(new Response("<html></html>", { status: 200 }));

		const result = await probe({
			readCertificate: async () => ({ validTo: daysFromNow(20) }),
		}).probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("certificat TLS expire le 2026-12-08");
	});

	it("is unavailable when the certificate has expired", async () => {
		stubFetch(new Response("<html></html>", { status: 200 }));

		const result = await probe({
			readCertificate: async () => ({ validTo: daysFromNow(-1) }),
		}).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("certificat TLS expiré le 2026-11-17");
	});

	it("stays operational when the certificate cannot be read", async () => {
		stubFetch(new Response("<html></html>", { status: 200 }));

		const result = await probe({
			readCertificate: async () => null,
		}).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
	});

	it("does not read a certificate on a plain http URL", async () => {
		stubFetch(new Response("<html></html>", { status: 200 }));
		const readCertificate = vi.fn(async () => ({ validTo: daysFromNow(-1) }));

		const result = await probe({
			publicUrl: "http://localhost:3000",
			readCertificate,
		}).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(readCertificate).not.toHaveBeenCalled();
	});

	it("is unavailable and leaks no host when the ingress cannot be reached", async () => {
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
