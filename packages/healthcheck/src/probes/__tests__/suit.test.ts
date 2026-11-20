import forge from "node-forge";
import type { SuitClient } from "suit-transport";
import { describe, expect, it, vi } from "vitest";

import {
	certificateResult,
	createSuitCertificateProbe,
	createSuitCseProbe,
	createSuitFilesProbe,
	createSuitGipMdsProbe,
	readClientCertificateNotAfter,
} from "../suit.js";

const NOW = new Date("2026-11-20T10:00:00.000Z");
const SIREN = "130025265";

function jsonResponse(status: number, body: unknown = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function fakeClient(
	fetchJson: () => Promise<Response>,
	fetchRaw: () => Promise<Response> = async () => jsonResponse(200),
): SuitClient {
	return {
		fetchJson: vi.fn(fetchJson),
		fetchRaw: vi.fn(fetchRaw),
	};
}

describe("createSuitCseProbe", () => {
	it("reports a missing client certificate as our misconfiguration", async () => {
		const client = fakeClient(async () => jsonResponse(200));

		const result = await createSuitCseProbe({
			client,
			referenceSiren: SIREN,
			certificateConfigured: false,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({
			status: "misconfigured",
			message: "certificat client SUIT absent",
		});
		expect(client.fetchJson).not.toHaveBeenCalled();
	});

	it("reads the CSE route for the reference SIREN", async () => {
		const client = fakeClient(async () => jsonResponse(200, { CSE: true }));

		const result = await createSuitCseProbe({
			client,
			referenceSiren: SIREN,
			certificateConfigured: true,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(client.fetchJson).toHaveBeenCalledWith(
			`/suit/api/externe/portail/CSE/${SIREN}`,
		);
		expect(result.status).toBe("operational");
	});

	it("turns a 500 into an outage", async () => {
		const result = await createSuitCseProbe({
			client: fakeClient(async () => jsonResponse(500)),
			referenceSiren: SIREN,
			certificateConfigured: true,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({
			status: "unavailable",
			message: "SUIT répond 500",
		});
	});

	it("turns a refused certificate into a misconfiguration", async () => {
		const result = await createSuitCseProbe({
			client: fakeClient(async () => jsonResponse(403)),
			referenceSiren: SIREN,
			certificateConfigured: true,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({
			status: "misconfigured",
			message: "SUIT refuse le certificat client (HTTP 403)",
		});
	});

	it("counts any answered status as proof the handshake worked", async () => {
		const result = await createSuitCseProbe({
			client: fakeClient(async () => jsonResponse(404)),
			referenceSiren: SIREN,
			certificateConfigured: true,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({
			status: "operational",
			message: "SUIT répond 404",
		});
	});

	it("reports a transport failure as unavailable, without the secret", async () => {
		const result = await createSuitCseProbe({
			client: fakeClient(async () => {
				throw new Error("connect ECONNREFUSED super-secret-value");
			}),
			referenceSiren: SIREN,
			certificateConfigured: true,
			secrets: ["super-secret-value"],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).not.toContain("super-secret-value");
	});
});

describe("createSuitGipMdsProbe", () => {
	it("asks the metadata route without an Accept header", async () => {
		const fetchRaw = vi.fn(async () => jsonResponse(200));
		const client: SuitClient = { fetchJson: vi.fn(), fetchRaw };

		const result = await createSuitGipMdsProbe({
			client,
			apiUrl: "https://api.suit.example.com",
			certificateConfigured: true,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(fetchRaw).toHaveBeenCalledWith(
			"https://api.suit.example.com/suit/api/externe/egapro/gipmds/latest/metadata",
			expect.objectContaining({ signal: expect.anything() }),
		);
		const [, init] = fetchRaw.mock.calls[0] as unknown as [string, RequestInit];
		expect(init.headers).toBeUndefined();
		expect(result.status).toBe("operational");
	});

	it("requires the client certificate", async () => {
		const result = await createSuitGipMdsProbe({
			client: fakeClient(async () => jsonResponse(200)),
			apiUrl: "https://api.suit.example.com",
			certificateConfigured: false,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});

	it("separates the WAF refusal from an outage", async () => {
		const forbidden = await createSuitGipMdsProbe({
			client: fakeClient(
				async () => jsonResponse(200),
				async () => new Response("<html>x-waf-blocked</html>", { status: 403 }),
			),
			apiUrl: "https://api.suit.example.com",
			certificateConfigured: true,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(forbidden).toMatchObject({
			status: "misconfigured",
			message: "SUIT refuse le certificat client (HTTP 403)",
		});
	});
});

describe("createSuitFilesProbe", () => {
	const gateway = { baseUrl: "https://api-suit.example.gouv.fr", apiKey: "k" };

	it("stays silent without a gateway or a reference SIREN", async () => {
		const result = await createSuitFilesProbe({
			gateway: null,
			referenceSiren: SIREN,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({
			status: "operational",
			message: "non configuré",
		});
	});

	it("reads the file route through the gateway, for the current year", async () => {
		const fetchImpl = vi.fn(async () => jsonResponse(200, []));

		await createSuitFilesProbe({
			gateway,
			referenceSiren: SIREN,
			secrets: [],
			fetchImpl: fetchImpl as unknown as typeof fetch,
			now: () => NOW,
		}).probe(new AbortController().signal);

		const [url, init] = fetchImpl.mock.calls[0] as unknown as [
			URL,
			RequestInit,
		];
		expect(url.toString()).toBe(
			`https://api-suit.example.gouv.fr/api/v1/files?siren=${SIREN}&year=2026`,
		);
		expect(init.headers).toMatchObject({ Authorization: "Bearer k" });
	});

	it("turns a refused key into a misconfiguration", async () => {
		const result = await createSuitFilesProbe({
			gateway,
			referenceSiren: SIREN,
			secrets: [],
			fetchImpl: (async () => jsonResponse(401)) as unknown as typeof fetch,
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({
			status: "misconfigured",
			message: "clé du consumer de supervision refusée",
		});
	});

	it("turns a 5xx into an outage", async () => {
		const result = await createSuitFilesProbe({
			gateway,
			referenceSiren: SIREN,
			secrets: [],
			fetchImpl: (async () => jsonResponse(503)) as unknown as typeof fetch,
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({ status: "unavailable" });
	});

	it("flags a 200 that is not JSON", async () => {
		const result = await createSuitFilesProbe({
			gateway,
			referenceSiren: SIREN,
			secrets: [],
			fetchImpl: (async () =>
				new Response("<html>maintenance</html>", {
					status: 200,
					headers: { "content-type": "text/html" },
				})) as unknown as typeof fetch,
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({
			status: "degraded",
			message: "réponse non JSON",
		});
	});

	it("counts a 404 as an answer: the chain works, the data does not exist", async () => {
		const result = await createSuitFilesProbe({
			gateway,
			referenceSiren: SIREN,
			secrets: [],
			fetchImpl: (async () =>
				jsonResponse(404, { error: "not found" })) as unknown as typeof fetch,
		}).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
	});
});

describe("certificateResult", () => {
	it("stays green beyond the warning window", () => {
		expect(
			certificateResult(new Date("2027-06-01T00:00:00Z"), NOW, 30),
		).toEqual({ status: "operational" });
	});

	it("degrades inside the warning window", () => {
		const result = certificateResult(new Date("2026-12-10T00:00:00Z"), NOW, 30);

		expect(result.status).toBe("degraded");
		expect(result.message).toContain("expire le");
	});

	it("turns red inside the last week", () => {
		const result = certificateResult(new Date("2026-11-24T00:00:00Z"), NOW, 30);

		expect(result.status).toBe("unavailable");
		expect(result.message).toContain("dans 4 j");
	});

	it("turns red once expired", () => {
		const result = certificateResult(new Date("2026-11-01T00:00:00Z"), NOW, 30);

		expect(result.status).toBe("unavailable");
		expect(result.message).toContain("expiré le");
	});
});

describe("createSuitCertificateProbe", () => {
	it("stays green without a configured bundle", async () => {
		const result = await createSuitCertificateProbe({
			p12Base64: null,
			passphrase: null,
			certWarnDays: 30,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toMatchObject({
			status: "operational",
			message: "non configuré",
		});
	});

	it("reports an unreadable bundle as misconfigured, without the passphrase", async () => {
		const result = await createSuitCertificateProbe({
			p12Base64: "not-a-pkcs12",
			passphrase: "my-passphrase",
			certWarnDays: 30,
			secrets: ["my-passphrase"],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
		expect(result.message).not.toContain("my-passphrase");
	});

	it("reads the certificate through node-forge", async () => {
		const { base64, notAfter } = buildPkcs12("my-passphrase");

		const result = await createSuitCertificateProbe({
			p12Base64: base64,
			passphrase: "my-passphrase",
			certWarnDays: 30,
			secrets: [],
			now: () => new Date("2026-01-01T00:00:00Z"),
		}).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(notAfter.getUTCFullYear()).toBe(2027);
	});

	it("refuses a wrong passphrase as misconfigured", async () => {
		const { base64 } = buildPkcs12("my-passphrase");

		const result = await createSuitCertificateProbe({
			p12Base64: base64,
			passphrase: "wrong",
			certWarnDays: 30,
			secrets: [],
			now: () => new Date("2026-01-01T00:00:00Z"),
		}).probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});
});

describe("readClientCertificateNotAfter", () => {
	it("returns the notAfter of the bundle", () => {
		const { base64, notAfter } = buildPkcs12(null);

		expect(readClientCertificateNotAfter(base64, null)).toEqual(notAfter);
	});

	it("rejects a payload that is not a PKCS#12", () => {
		expect(() => readClientCertificateNotAfter("bm90LWEtcDEy", null)).toThrow();
	});
});

function buildPkcs12(passphrase: string | null): {
	base64: string;
	notAfter: Date;
} {
	const keys = forge.pki.rsa.generateKeyPair(1024);
	const certificate = forge.pki.createCertificate();
	certificate.publicKey = keys.publicKey;
	certificate.serialNumber = "01";
	certificate.validity.notBefore = new Date("2026-01-01T00:00:00Z");
	certificate.validity.notAfter = new Date("2027-01-01T00:00:00Z");
	const attributes = [{ name: "commonName", value: "egapro-test" }];
	certificate.setSubject(attributes);
	certificate.setIssuer(attributes);
	certificate.sign(keys.privateKey, forge.md.sha256.create());

	const asn1 = forge.pkcs12.toPkcs12Asn1(
		keys.privateKey,
		[certificate],
		passphrase ?? "",
	);
	const base64 = forge.util.encode64(forge.asn1.toDer(asn1).getBytes());

	return { base64, notAfter: certificate.validity.notAfter };
}
