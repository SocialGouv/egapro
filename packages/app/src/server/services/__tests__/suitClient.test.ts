import { afterEach, describe, expect, it, vi } from "vitest";

const P12_CONTENT = "fake-p12-bundle";
const P12_BASE64 = Buffer.from(P12_CONTENT).toString("base64");

const AgentMock = vi.fn();

async function loadSuitClient(certEnv: Record<string, string | undefined>) {
	vi.resetModules();
	AgentMock.mockClear();
	vi.doMock("undici", () => ({ Agent: AgentMock }));
	vi.doMock("~/env", () => ({
		env: {
			EGAPRO_SUIT_API_URL: "https://api.suit.example.com/",
			...certEnv,
		},
	}));

	const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
	vi.stubGlobal("fetch", fetchSpy);

	const { suitFetch, suitAwareFetch } = await import("../suitClient");
	return { suitFetch, suitAwareFetch, fetchSpy };
}

const WITH_CERT = {
	EGAPRO_SUIT_CLIENT_CERT_P12_BASE64: P12_BASE64,
	EGAPRO_SUIT_CLIENT_CERT_PASSWORD: "cert-password",
};

afterEach(() => {
	vi.doUnmock("undici");
	vi.doUnmock("~/env");
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe("suitFetch", () => {
	it("builds the URL from the configured base, without a double slash", async () => {
		const { suitFetch, fetchSpy } = await loadSuitClient({});

		await suitFetch("/suit/api/externe/portail/CSE/339787277");

		expect(fetchSpy).toHaveBeenCalledWith(
			"https://api.suit.example.com/suit/api/externe/portail/CSE/339787277",
			expect.objectContaining({ headers: { Accept: "application/json" } }),
		);
	});

	it("refuses to follow redirects, which would leak the certificate", async () => {
		const { suitFetch, fetchSpy } = await loadSuitClient({
			EGAPRO_SUIT_CLIENT_CERT_P12_BASE64: P12_BASE64,
		});

		await suitFetch("/suit/api/externe/portail/CSE/339787277");

		// A followed redirect re-uses the dispatcher, presenting the client
		// certificate to whatever host the 3xx points at.
		expect(fetchSpy.mock.calls[0]?.[1].redirect).toBe("error");
	});

	it("calls without a client certificate when none is configured", async () => {
		const { suitFetch, fetchSpy } = await loadSuitClient({});

		await suitFetch("/suit/api/externe/portail/CSE/339787277");

		expect(AgentMock).not.toHaveBeenCalled();
		expect(fetchSpy.mock.calls[0]?.[1].dispatcher).toBeUndefined();
	});

	it("presents the decoded certificate and its passphrase", async () => {
		const { suitFetch, fetchSpy } = await loadSuitClient({
			EGAPRO_SUIT_CLIENT_CERT_P12_BASE64: P12_BASE64,
			EGAPRO_SUIT_CLIENT_CERT_PASSWORD: "cert-password",
		});

		await suitFetch("/suit/api/externe/portail/CSE/339787277");

		expect(AgentMock).toHaveBeenCalledTimes(1);
		const connect = AgentMock.mock.calls[0]?.[0].connect;
		expect(connect.passphrase).toBe("cert-password");
		expect(Buffer.isBuffer(connect.pfx)).toBe(true);
		expect(connect.pfx.toString()).toBe(P12_CONTENT);

		// The agent built from the certificate is the one actually used.
		expect(fetchSpy.mock.calls[0]?.[1].dispatcher).toBeInstanceOf(AgentMock);
	});

	it("builds the agent once and reuses it across calls", async () => {
		const { suitFetch, fetchSpy } = await loadSuitClient({
			EGAPRO_SUIT_CLIENT_CERT_P12_BASE64: P12_BASE64,
			EGAPRO_SUIT_CLIENT_CERT_PASSWORD: "cert-password",
		});

		await suitFetch("/suit/api/externe/portail/CSE/339787277");
		await suitFetch("/suit/api/externe/portail/sanction/339787277");

		expect(AgentMock).toHaveBeenCalledTimes(1);
		expect(fetchSpy.mock.calls[0]?.[1].dispatcher).toBe(
			fetchSpy.mock.calls[1]?.[1].dispatcher,
		);
	});

	it("accepts a certificate without a passphrase", async () => {
		const { suitFetch } = await loadSuitClient({
			EGAPRO_SUIT_CLIENT_CERT_P12_BASE64: P12_BASE64,
		});

		await suitFetch("/suit/api/externe/portail/CSE/339787277");

		expect(AgentMock.mock.calls[0]?.[0].connect.passphrase).toBeUndefined();
	});

	it("ignores line breaks in a wrapped base64 bundle", async () => {
		const wrapped = `${P12_BASE64.slice(0, 4)}\n${P12_BASE64.slice(4)}`;
		const { suitFetch } = await loadSuitClient({
			EGAPRO_SUIT_CLIENT_CERT_P12_BASE64: wrapped,
		});

		await suitFetch("/suit/api/externe/portail/CSE/339787277");

		expect(AgentMock.mock.calls[0]?.[0].connect.pfx.toString()).toBe(
			P12_CONTENT,
		);
	});
});

describe("suitAwareFetch", () => {
	const SUIT_GIP_URL =
		"https://api.suit.example.com/suit/api/externe/egapro/gipmds/latest";

	it("presents the certificate when the URL is on the SUIT origin", async () => {
		const { suitAwareFetch, fetchSpy } = await loadSuitClient(WITH_CERT);

		await suitAwareFetch(SUIT_GIP_URL);

		expect(fetchSpy.mock.calls[0]?.[0]).toBe(SUIT_GIP_URL);
		expect(fetchSpy.mock.calls[0]?.[1].dispatcher).toBeInstanceOf(AgentMock);
		expect(fetchSpy.mock.calls[0]?.[1].redirect).toBe("error");
	});

	it("never presents the certificate to the internal GIP mock", async () => {
		const { suitAwareFetch, fetchSpy } = await loadSuitClient(WITH_CERT);

		// What EGAPRO_GIP_MDS_API_URL points at outside production.
		await suitAwareFetch("http://app/api/gip-mds/mock");

		expect(AgentMock).not.toHaveBeenCalled();
		expect(fetchSpy.mock.calls[0]?.[1]?.dispatcher).toBeUndefined();
	});

	it("never presents the certificate to a look-alike host", async () => {
		const { suitAwareFetch, fetchSpy } = await loadSuitClient(WITH_CERT);

		await suitAwareFetch("https://api.suit.example.com.evil.test/latest");

		expect(fetchSpy.mock.calls[0]?.[1]?.dispatcher).toBeUndefined();
	});

	it("treats a different scheme or port as a different origin", async () => {
		const { suitAwareFetch, fetchSpy } = await loadSuitClient(WITH_CERT);

		await suitAwareFetch("http://api.suit.example.com/latest");
		await suitAwareFetch("https://api.suit.example.com:8443/latest");

		for (const call of fetchSpy.mock.calls) {
			expect(call[1]?.dispatcher).toBeUndefined();
		}
	});

	it("forwards the caller's init and does not fail on a malformed URL", async () => {
		const { suitAwareFetch, fetchSpy } = await loadSuitClient(WITH_CERT);
		const signal = AbortSignal.timeout(30_000);

		await suitAwareFetch("not-a-url", { signal });

		expect(fetchSpy.mock.calls[0]?.[1].signal).toBe(signal);
		expect(fetchSpy.mock.calls[0]?.[1].dispatcher).toBeUndefined();
	});
});
