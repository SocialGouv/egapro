import { afterEach, describe, expect, it, vi } from "vitest";

const API_URL = "https://api.suit.example.com/";
const P12_CONTENT = "fake-p12-bundle";
const P12_BASE64 = Buffer.from(P12_CONTENT).toString("base64");

const AgentMock = vi.fn();
const undiciFetchSpy = vi.fn();

async function loadClient(
	config: { p12Base64?: string; passphrase?: string } = {},
) {
	vi.resetModules();
	AgentMock.mockClear();
	undiciFetchSpy.mockReset().mockResolvedValue({ ok: true });
	vi.doMock("undici", () => ({ Agent: AgentMock, fetch: undiciFetchSpy }));

	const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
	vi.stubGlobal("fetch", fetchSpy);

	const { createSuitClient } = await import("../index.js");
	return {
		client: createSuitClient({ apiUrl: API_URL, ...config }),
		fetchSpy,
		undiciFetchSpy,
	};
}

afterEach(() => {
	vi.doUnmock("undici");
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe("createSuitClient — fetchJson", () => {
	it("joins the base URL and the path, and asks for JSON", async () => {
		const { client, fetchSpy } = await loadClient();

		await client.fetchJson("/suit/api/externe/portail/CSE/339787277");

		expect(fetchSpy).toHaveBeenCalledWith(
			"https://api.suit.example.com/suit/api/externe/portail/CSE/339787277",
			expect.objectContaining({ headers: { Accept: "application/json" } }),
		);
	});

	it("refuses to follow redirects, which would leak the certificate", async () => {
		const { client, undiciFetchSpy } = await loadClient({
			p12Base64: P12_BASE64,
		});

		await client.fetchJson("/suit/api/externe/portail/CSE/339787277");

		expect(undiciFetchSpy.mock.calls[0]?.[1].redirect).toBe("error");
	});

	it("calls without a client certificate when none is configured", async () => {
		const { client, fetchSpy } = await loadClient();

		await client.fetchJson("/suit/api/externe/portail/CSE/339787277");

		expect(AgentMock).not.toHaveBeenCalled();
		expect(fetchSpy.mock.calls[0]?.[1].dispatcher).toBeUndefined();
	});

	it("presents the decoded certificate and its passphrase", async () => {
		const { client, fetchSpy, undiciFetchSpy } = await loadClient({
			p12Base64: P12_BASE64,
			passphrase: "cert-password",
		});

		await client.fetchJson("/suit/api/externe/portail/CSE/339787277");

		expect(AgentMock).toHaveBeenCalledTimes(1);
		expect(AgentMock.mock.calls[0]?.[0].allowH2).toBe(false);
		const connect = AgentMock.mock.calls[0]?.[0].connect;
		expect(connect.passphrase).toBe("cert-password");
		expect(Buffer.isBuffer(connect.pfx)).toBe(true);
		expect(connect.pfx.toString()).toBe(P12_CONTENT);

		// The agent built from the certificate is the one actually used.
		expect(undiciFetchSpy.mock.calls[0]?.[1].dispatcher).toBeInstanceOf(
			AgentMock,
		);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("reuses the agent across calls", async () => {
		const { client, undiciFetchSpy } = await loadClient({
			p12Base64: P12_BASE64,
			passphrase: "cert-password",
		});

		await client.fetchJson("/suit/api/externe/portail/CSE/339787277");
		await client.fetchJson("/suit/api/externe/portail/CSE/987654321");

		expect(AgentMock).toHaveBeenCalledTimes(1);
		expect(undiciFetchSpy.mock.calls[0]?.[1].dispatcher).toBe(
			undiciFetchSpy.mock.calls[1]?.[1].dispatcher,
		);
	});

	it("accepts a certificate without a passphrase", async () => {
		const { client } = await loadClient({ p12Base64: P12_BASE64 });

		await client.fetchJson("/suit/api/externe/portail/CSE/339787277");

		expect(AgentMock.mock.calls[0]?.[0].connect.passphrase).toBeUndefined();
	});

	it("ignores line breaks in a wrapped base64 bundle", async () => {
		const wrapped = `${P12_BASE64.slice(0, 4)}\n${P12_BASE64.slice(4)}`;
		const { client } = await loadClient({ p12Base64: wrapped });

		await client.fetchJson("/suit/api/externe/portail/CSE/339787277");

		expect(AgentMock.mock.calls[0]?.[0].connect.pfx.toString()).toBe(
			P12_CONTENT,
		);
	});
});

describe("createSuitClient — fetchRaw", () => {
	const SUIT_GIP_URL =
		"https://api.suit.example.com/suit/api/externe/egapro/gipmds/latest";

	it("presents the certificate when the URL is on the SUIT origin", async () => {
		const { client, undiciFetchSpy } = await loadClient({
			p12Base64: P12_BASE64,
		});

		await client.fetchRaw(SUIT_GIP_URL);

		expect(undiciFetchSpy.mock.calls[0]?.[0]).toBe(SUIT_GIP_URL);
		expect(undiciFetchSpy.mock.calls[0]?.[1].dispatcher).toBeInstanceOf(
			AgentMock,
		);
		expect(undiciFetchSpy.mock.calls[0]?.[1].redirect).toBe("error");
	});

	it("never presents the certificate to the internal GIP mock", async () => {
		const { client, fetchSpy } = await loadClient({ p12Base64: P12_BASE64 });

		// What EGAPRO_GIP_MDS_API_URL points at outside production.
		await client.fetchRaw("http://app/api/gip-mds/mock");

		expect(AgentMock).not.toHaveBeenCalled();
		expect(fetchSpy.mock.calls[0]?.[1]?.dispatcher).toBeUndefined();
	});

	it("never presents the certificate to a look-alike host", async () => {
		const { client, fetchSpy } = await loadClient({ p12Base64: P12_BASE64 });

		await client.fetchRaw("https://api.suit.example.com.evil.test/latest");

		expect(fetchSpy.mock.calls[0]?.[1]?.dispatcher).toBeUndefined();
	});

	it("treats a different scheme or port as a different origin", async () => {
		const { client, fetchSpy } = await loadClient({ p12Base64: P12_BASE64 });

		await client.fetchRaw("http://api.suit.example.com/latest");
		await client.fetchRaw("https://api.suit.example.com:8443/latest");

		for (const call of fetchSpy.mock.calls) {
			expect(call[1]?.dispatcher).toBeUndefined();
		}
	});

	it("forwards the caller's init and does not fail on a malformed URL", async () => {
		const { client, fetchSpy } = await loadClient({ p12Base64: P12_BASE64 });
		const signal = AbortSignal.timeout(30_000);

		await client.fetchRaw("not-a-url", { signal });

		expect(fetchSpy.mock.calls[0]?.[1].signal).toBe(signal);
		expect(fetchSpy.mock.calls[0]?.[1].dispatcher).toBeUndefined();
	});
});
