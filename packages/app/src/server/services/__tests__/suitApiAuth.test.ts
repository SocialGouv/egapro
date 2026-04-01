import { describe, expect, it, vi } from "vitest";

import { verifySuitApiKey, verifySuitClientCert } from "../suitApiAuth";

// Test certificates generated with openssl (CA + client signed by CA + wrong-CA client + expired client)
const TEST_CA_PEM_B64 =
	"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCVENDQWUyZ0F3SUJBZ0lVVTYvc3Rwb3lDMGIxZ29QZDdQUzh4RFJkbDlZd0RRWUpLb1pJaHZjTkFRRUwKQlFBd0VqRVFNQTRHQTFVRUF3d0hWR1Z6ZENCRFFUQWVGdzB5TmpBME1ERXhNVE15TWpaYUZ3MHpOakF6TWpreApNVE15TWpaYU1CSXhFREFPQmdOVkJBTU1CMVJsYzNRZ1EwRXdnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCCkR3QXdnZ0VLQW9JQkFRQzBVZTJ0WkQzbit1UFg0VTVOMTZTOG1RL0Z5dTM1UStpS2ZBYjJ4YVoyZTlING1JYTQKeDVNMUpJTEpGK1JlWElnVGVWcXZadVpyWjRUWThYVVVBK0FuNTJLdEZpK0RkVzVKMFNOSGgvbm5zbEQ0dHdvegplT2pzYTJzK1d5VjZSeVVYZkVIQzI2R1UwUGUwZ25aakFzb0dvb0U2TUJIMWNDOFYvaE4zQWVWeklYaXJJR2o2CjYrbk5ySnVla0xlTER2NVBLL2haRVRDazhDU0c2S1JHOGoxR1NKREVnS3ZZb1RJTjUzWjFqTjVXUFpOT1BvbzUKQktObzdySkI0OExRQ1dJWUI0bmg5bTM3RUFGUXVubmRGa2U0L3J2M3J3OElGMDZNRmZCQTd5cFcxQmdOOEJ6UgoycDl1aUI4ZzI0YnBSQjEvZEIxRzB3bklEenYzd0YvUTBzMEJBZ01CQUFHalV6QlJNQjBHQTFVZERnUVdCQlMyCnZjT0JzK2cxdHZIRkRGN1lvbHBJalFlc1ZqQWZCZ05WSFNNRUdEQVdnQlMydmNPQnMrZzF0dkhGREY3WW9scEkKalFlc1ZqQVBCZ05WSFJNQkFmOEVCVEFEQVFIL01BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQ2N5VjMzQ2Y4RgpRbUVZUkN2NVBLY3JhdTMwbGp6dnR0L2lWWUExTHdNRFoxcjVvNDVXZENUMmFubjZ6WUxoUmlCWnlXSG5EOTVCCjhTNUxDOUR4ZHJ1alN5akVBeU8zS2lSbzNNa3p5c0NaZTY0OEs3dThDNVBuZnNLRjlsSGl0TlBVTUZkUldxRzMKZ1hJUHZCdi9IaTRDMzd3S1YxVG81QjFZUjlqdk1xeFBycEJSN2hsOENzU3A2WCsxeWNsR3dZUnJ0ejJjSHd6UgpVYjZGS1pDMlZveElmakpuSFBPaGZkalA1MlJ4dUMrandBaXBIRHAzdGJoV3Y3bmJDelh2MVVpVXpVNG9VUVl6ClNvaFFIT1U0bWk0eE5LZ0pFeVNORHZzY1pJa0kvdlRmMXEvMzNnR2lENS9aMlFhSEVCL3k2MnJrR0R5S0FlL0IKRHZ2UEk3QXZSVVk3Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K";
const TEST_CLIENT_CERT_B64 =
	"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMrRENDQWVDZ0F3SUJBZ0lVQ0x1QWFQVTJLWGdaOVZxU3lnSTRQcW16SGljd0RRWUpLb1pJaHZjTkFRRUwKQlFBd0VqRVFNQTRHQTFVRUF3d0hWR1Z6ZENCRFFUQWVGdzB5TmpBME1ERXhNVE15TWpaYUZ3MHpOakF6TWpreApNVE15TWpaYU1CWXhGREFTQmdOVkJBTU1DMVJsYzNRZ1EyeHBaVzUwTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGCkFBT0NBUThBTUlJQkNnS0NBUUVBczd4SFJhbEJGeCtJTDR0SW1EYjFkV2NuZnJycit3S28rVmM1c2NOcTlMN3cKTjVtVU5DdHRUNEhNNzAxS1hpNDQ3QmhRVDJ5SCsxbzhPVGpZRmZ3SWlLc0Y2c3h4ZkNHcGFBK2hrNjErRGg5RgpsN0RBWmJHWjIzT0krYlpjaS95MWp2Qm9ET0V3aExMNllBZlVCRVNmZ0pRUzBIVWgzVGpCbURLUU9aWTltQmZJCmpOYzlNbUR0alFIeGludkRTditrMlFhMFQ5TUxKNW5SRDRUQUF1aE9mR0VhOHA0Nm8wL0RqeDQvb3hKN3dKenEKNVFCcUxFdlJkRE1VSEdwN25BL3QzMGk4OTZWbFByWU4xZUdvdmVXWEZ6U3d4dTlRL0NZNXFQc1UwelkySkNWZApjTHJ4M3BXY1YrNXlVa0ptRmFKMWFuTVE3QXJ5dGR5bGZJMlh3d01YZXdJREFRQUJvMEl3UURBZEJnTlZIUTRFCkZnUVVwSnNlMkh3T0oxcWk1cnNsU3ZIZ1VlY2ZuR3N3SHdZRFZSMGpCQmd3Rm9BVXRyM0RnYlBvTmJieHhReGUKMktKYVNJMEhyRll3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUlkYUR3S0hvRlZSQUR1NFRSOWZYZkpFa3BvVgpRUS83OXZzN2JOejNYWGpES3BSbzJBRndxTW9EdThZcnRTS3kydUVzVkNHQjlDdDR4Wnd1SG9KbHpueU9xYllHClYyU1JtYnI3VUlUMVRuL2JnZHN5NTJXMS9vSDJORUNzeHd5c0FDd3BYS0RBclhJT2orMUZ4ekNZZFd6cUhNTWoKbDZwTXhDRDkyTVJsTTVNYUxQQy9FeHBieFZEWnBnS0hlS2FSYXBmMjVpb2xZMGtENnZQTWF3N3A5cmJzUmE5YwpHejVqb3JPYkdsT1BxWDJMcDJnOXNTQmlPWDZoOUZqTE1NWHVuTjVzdXU1QmhlZVg0RnFYSTVBSE9DcEZnWG9OCjdkaHR5bzIvdERScy81bHU1Wk9GaXpZY0owSlkyeUQwcm5pem0xcm5QMFBQcjZiWUJNQnhNVEhUT04wPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==";
const TEST_WRONG_CA_CERT_B64 =
	"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUREekNDQWZlZ0F3SUJBZ0lVVlA5a1B4NVg3UGErYTJmV0ZZeTRtdjFZaHhZd0RRWUpLb1pJaHZjTkFRRUwKQlFBd0Z6RVZNQk1HQTFVRUF3d01UM1JvWlhJZ1EyeHBaVzUwTUI0WERUSTJNRFF3TVRFeE16SXlObG9YRFRNMgpNRE15T1RFeE16SXlObG93RnpFVk1CTUdBMVVFQXd3TVQzUm9aWElnUTJ4cFpXNTBNSUlCSWpBTkJna3Foa2lHCjl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUExbzBNVzZVQm13TXd5YnVvbTBDeENhelkwaHBDQ1FYb2NEZ00KOHlYTnBCRHliRVdvT3VaVHNjSzM0STU5MjFmMkU1Q2JMdS9lcS9jTUhXVW1IWGxhcUx6eGJHT3p3bDl3N3IyRApUUy8vekZlVFdEWk1iZkpLTUk0OU1pNFNMdlJPOWFqQkJJcVZpcUNOQ1ZBakFnNERua3ZOelNiNWppeTdXNDNhCjZ6UTgrbmlROUhMWXpQOXVUaWxsWExDZ0pQVFlxWnFMSFpPZzhhcHdBc2xKNEhtUkZNMmtLU2pHdjRuL0hmUkwKc2FvY0xlVGdHSHU3QXhhODF3ZFFlYndQVHl1ditkRDFGNmQ5b0RQVkx0NFJQUmFYK2NsWFV3dnUvbTNJSkxSLwpteFhibU9nSWtsc25CZkNINHhuM3FNQm1QN1NqTkY1cUJXZHNyaXVaNXYxL1p0eUNWUUlEQVFBQm8xTXdVVEFkCkJnTlZIUTRFRmdRVW1ZYkVueVcrSDVJc2FVNDV4RUszWjZGTkJob3dId1lEVlIwakJCZ3dGb0FVbVliRW55VysKSDVJc2FVNDV4RUszWjZGTkJob3dEd1lEVlIwVEFRSC9CQVV3QXdFQi96QU5CZ2txaGtpRzl3MEJBUXNGQUFPQwpBUUVBZzFJK3JUWWd0L1hhWkQ2UElPbm1LNXNPWTluTWZKeFpSZDljbEJsTFg1L1pyUVhwYkNHcGVIL3gweUoyCmw3RkltYm1RZllTOE1CQ3FvelJJbDNja0RWa05VcFVKSnJXQ2I4dm0zOVNkVEZubGhnaHpPbnJmQlZJUWdld1EKQm1TT2RYOWZzMkFHQ2thUFhFaFVkM1BzVTl3UlpGSDFJNDR0V1dXQUJ5cSs0dEdEUEJ3Y3F2WTl3aTFWWG1KeQpidDFHZTIrZnBYMm5wNlBCR09hTTVKNmVhZzdERDE3SDJveXZDRUhPSEpFZnE0cExwYnovWFBYcGJWL0hsWENYCjQwdGNMaUFpSnNTU0FPcS93WHlOZ0EzMVBuK0YxaE5NQTlyLzVWNWg1QlFvb1BsMnJDckFVNmxja3FHRERTVzMKVEJhK2U1OEkrSHhNTHcvcUhYQzloeHRPU3c9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==";
const TEST_EXPIRED_CERT_B64 =
	"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMrekNDQWVPZ0F3SUJBZ0lVQ0x1QWFQVTJLWGdaOVZxU3lnSTRQcW16SGlvd0RRWUpLb1pJaHZjTkFRRUwKQlFBd0VqRVFNQTRHQTFVRUF3d0hWR1Z6ZENCRFFUQWVGdzB5TmpBME1ERXhNVE16TVRGYUZ3MHlOakEwTURFeApNVE16TVRGYU1Ca3hGekFWQmdOVkJBTU1Fa1Y0Y0dseVpXUWdRMnhwWlc1ME1JSUJJakFOQmdrcWhraUc5dzBCCkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQWs3RHIzUGtISkdTbXlkcWRsSWRNOXVzUGVnUFRBeFFEMXpPMWtvbWMKSU9BVHQ0Tk5oQmJQMnBwYjl3Y29yZURFNlZkWDNEUEZSRWNDdVFhMjdGWVpOdGNTZkxXK1M5Um1DNlltNFh3KwpFUHFmYXdyVUNzcHJMeGU1M2l3RG9jYmpDa0s1RHVMNDNscFZlZEJGUFdtSkROblZqNjQzaGx6blJHdThPc2JxCllKWmRnWDFnOUswSmNRK2pXd0o0dFFFaE1DTFhlY3RvalN3TUMvYzBjK2p0dDNkbVNVbnFSTDROeXROeXdqQ1MKN3FhTjRvRVdrZmpXSkJLMFAramRxODhMSkMwS0NZNjdaMitBeVFWOG1lamFSYVpyTStzdkZpMlROb01qS1RhawpkSExmZ1NoVFNYK3NwT3RCc2ZQQ1lOL3l4ZDJWbXBNTDk4VFJIWm9yZEVZZ1p3SURBUUFCbzBJd1FEQWRCZ05WCkhRNEVGZ1FVU0pCZGVQNFlTVkxLM3NxU0ZsTVJPQi9MWmVzd0h3WURWUjBqQkJnd0ZvQVV0cjNEZ2JQb05iYngKeFF4ZTJLSmFTSTBIckZZd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFLRXNsNy9CamQyRGpKK3QydnUxWGtWegpOWlpMNnU3UjhyRUsrVVFPVmJKUXJLdTdqV1lqRDhTQkdFV0dWVzJ2eHY3MXFPbEwrZGY2Z2RiRHRSY2ZlM2lQCm1BMkJnNXJSbTJBMEJJcTFCRkJuQmVZM0tzZnlKMm1WK0NidWMrZy9uR3YreDFFVFU0Y0JBT0lteDk0d0ZhS2UKVGpIa1NuZzFQalBMT216WTZMMnVmU1N0L3VmRU5nTnZNV2VnRXFlRXBEaENoZW5CcmpUYzlrbEg0OHRMUGNIVApqNE1vUW54RXVmS29DazhweU01ODNuamhVQk55dHpTYzA4OEg1V2o2WEQxZFVBVCtIdW9wLzdGWUFKZmFjb0VvCm5sVitHMzhHMjJMa3pUSVNBUTVKSVFGN3ZwWW5SSTFQZTNKTzhLSlZzcFRGZGR5VWViRklRNGsvMS9DWE1QVT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=";

function makeRequest(authHeader?: string): Request {
	const headers = new Headers();
	if (authHeader) {
		headers.set("Authorization", authHeader);
	}
	return new Request("http://localhost/api/v1/export/declarations", {
		headers,
	});
}

function makeRequestWithCert(clientCertB64?: string): Request {
	const headers = new Headers();
	if (clientCertB64) {
		headers.set("X-Client-Cert", clientCertB64);
	}
	return new Request("http://localhost/api/v1/export/declarations", {
		headers,
	});
}

describe("verifySuitApiKey", () => {
	it("returns true for a valid API key", () => {
		const request = makeRequest(
			"Bearer test-suit-api-key-that-is-at-least-32-chars",
		);
		const result = verifySuitApiKey(request);
		expect(result).toBe(true);
	});

	it("returns 401 when Authorization header is missing", async () => {
		const request = makeRequest();
		const result = verifySuitApiKey(request);

		expect(result).not.toBe(true);
		const response = result as Response;
		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Clé API manquante ou invalide");
	});

	it("returns 401 when header format is not Bearer", async () => {
		const request = makeRequest("Basic dXNlcjpwYXNz");
		const result = verifySuitApiKey(request);

		expect(result).not.toBe(true);
		const response = result as Response;
		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Clé API manquante ou invalide");
	});

	it("returns 401 when Bearer token is empty", async () => {
		const request = makeRequest("Bearer ");
		const result = verifySuitApiKey(request);

		expect(result).not.toBe(true);
		const response = result as Response;
		expect(response.status).toBe(401);
	});

	it("returns 401 when API key is wrong", async () => {
		const request = makeRequest(
			"Bearer wrong-key-that-is-definitely-not-valid",
		);
		const result = verifySuitApiKey(request);

		expect(result).not.toBe(true);
		const response = result as Response;
		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Clé API manquante ou invalide");
	});

	it("is case-insensitive for the Bearer prefix", () => {
		const request = makeRequest(
			"bearer test-suit-api-key-that-is-at-least-32-chars",
		);
		const result = verifySuitApiKey(request);
		expect(result).toBe(true);
	});
});

describe("verifySuitClientCert", () => {
	it("returns true when CA PEM is not configured (mTLS disabled)", () => {
		const request = makeRequestWithCert();
		const result = verifySuitClientCert(request);
		expect(result).toBe(true);
	});

	describe("when EGAPRO_SUIT_MTLS_CA_PEM is set", () => {
		async function importWithCaPem() {
			vi.resetModules();
			vi.doMock("server-only", () => ({}));
			vi.doMock("~/env", () => ({
				env: {
					EGAPRO_SUIT_MTLS_CA_PEM: TEST_CA_PEM_B64,
					EGAPRO_SUIT_API_KEY: "test-suit-api-key-that-is-at-least-32-chars",
				},
			}));
			const mod = await import("../suitApiAuth");
			return mod.verifySuitClientCert;
		}

		it("returns true for a valid client cert signed by the CA", async () => {
			const verify = await importWithCaPem();
			const request = makeRequestWithCert(TEST_CLIENT_CERT_B64);
			const result = verify(request);
			expect(result).toBe(true);
		});

		it("returns 403 when X-Client-Cert header is missing", async () => {
			const verify = await importWithCaPem();
			const request = makeRequestWithCert();
			const result = verify(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error).toBe("Certificat client manquant ou invalide");
		});

		it("returns 403 for a cert signed by a different CA", async () => {
			const verify = await importWithCaPem();
			const request = makeRequestWithCert(TEST_WRONG_CA_CERT_B64);
			const result = verify(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns 403 for an expired cert", async () => {
			const verify = await importWithCaPem();
			const request = makeRequestWithCert(TEST_EXPIRED_CERT_B64);
			const result = verify(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns 403 for invalid base64", async () => {
			const verify = await importWithCaPem();
			const request = makeRequestWithCert("not-valid-base64-cert-data!!!");
			const result = verify(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});
	});
});
