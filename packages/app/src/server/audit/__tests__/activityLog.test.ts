import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmitActivityLogParams } from "../activityLog";

// The global `~/env` mock pins NODE_ENV to "test"; overriding it lets the test-env guard be exercised both ways.
vi.mock("~/env", () => ({ env: { NODE_ENV: "production" } }));

const { emitActivityLog, deriveErrorCode, truncateIp } = await import(
	"../activityLog"
);
const { env } = await import("~/env");

function setNodeEnv(value: "test" | "production"): void {
	(env as { NODE_ENV: string }).NODE_ENV = value;
}

const FROZEN_NOW = "2026-03-02T09:14:27.512Z";

function buildParams(
	overrides: Partial<EmitActivityLogParams> = {},
): EmitActivityLogParams {
	return {
		source: "trpc",
		action: "declaration.update_step_1",
		category: "mutation",
		route: "declaration.updateStep1",
		operation: "mutation",
		status: "success",
		errorCode: null,
		durationMs: 1,
		userId: null,
		siren: null,
		ip: null,
		rawInput: null,
		...overrides,
	};
}

const PII_LADEN_INPUT = {
	phone: "0600000000",
	firstName: "Camille",
	email: "email@example.fr",
	query: "Société Démo",
	year: 2026,
	nested: { declarationId: "should-not-leak" },
};

const PII_VALUES = [
	"0600000000",
	"Camille",
	"email@example.fr",
	"Société Démo",
	"should-not-leak",
];

describe("truncateIp", () => {
	it("truncates an IPv4 address to its /16", () => {
		expect(truncateIp("203.0.113.45")).toBe("203.0.0.0");
	});

	it("truncates a full IPv6 address to its /48, canonically compressed", () => {
		expect(truncateIp("2001:db8:85a3:8d3:1319:8a2e:370:7348")).toBe(
			"2001:db8:85a3::",
		);
	});

	it("truncates an already-compressed IPv6 address", () => {
		expect(truncateIp("2001:db8::1")).toBe("2001:db8::");
	});

	it("treats an IPv4-mapped IPv6 address as IPv4", () => {
		expect(truncateIp("::ffff:203.0.113.45")).toBe("203.0.0.0");
	});

	it("returns null for a non-IP string", () => {
		expect(truncateIp("not-an-ip")).toBeNull();
	});

	it("returns null when the header is absent", () => {
		expect(truncateIp(null)).toBeNull();
		expect(truncateIp(undefined)).toBeNull();
	});

	it("returns null for an IP carrying a port suffix rather than stripping it", () => {
		expect(truncateIp("203.0.113.45:8080")).toBeNull();
		expect(truncateIp("[2001:db8::1]:443")).toBeNull();
	});

	it("returns null for an empty or whitespace-only value", () => {
		expect(truncateIp("")).toBeNull();
		expect(truncateIp("   ")).toBeNull();
	});

	it("normalizes case and leading zeros before truncating an IPv6 address", () => {
		expect(truncateIp("2001:0DB8:0000:0000:0000:0000:0000:0001")).toBe(
			"2001:db8::",
		);
	});

	it("expands a leading :: so explicit groups land in their real /48 position", () => {
		expect(truncateIp("::1")).toBe("::");
		expect(truncateIp("::a:b:c:d:e:f")).toBe("0:0:a::");
	});

	it("drops an IPv6 zone identifier", () => {
		expect(truncateIp("fe80::1%eth0")).toBe("fe80::");
	});

	it("truncates a hex-written IPv4-mapped address like its dotted form", () => {
		expect(truncateIp("::ffff:cb00:712d")).toBe("203.0.0.0");
	});
});

describe("deriveErrorCode", () => {
	it("extracts the code from a tRPC-style '<CODE>: message' string", () => {
		expect(deriveErrorCode("UNAUTHORIZED: no session")).toBe("UNAUTHORIZED");
	});

	it("extracts the code from a NextAuth-style '<CODE>: {...}' string", () => {
		expect(
			deriveErrorCode('OAUTH_CALLBACK_ERROR: {"type":"OAuthCallbackError"}'),
		).toBe("OAUTH_CALLBACK_ERROR");
	});

	it("maps an 'HTTP <status>' message to 'HTTP_<status>'", () => {
		expect(deriveErrorCode("HTTP 403")).toBe("HTTP_403");
	});

	it("falls back to ERROR for an unrecognized message", () => {
		expect(deriveErrorCode("boom")).toBe("ERROR");
	});

	it("returns null when there is no error message", () => {
		expect(deriveErrorCode(null)).toBeNull();
		expect(deriveErrorCode(undefined)).toBeNull();
		expect(deriveErrorCode("")).toBeNull();
	});
});

describe("emitActivityLog", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// A frozen clock keeps the timestamp from accidentally containing a value the leak assertions look for.
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date(FROZEN_NOW));
		consoleLogSpy = vi
			.spyOn(console, "log")
			.mockImplementation(() => undefined);
		consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		vi.useRealTimers();
		setNodeEnv("production");
	});

	function parseLastLine(): Record<string, unknown> {
		const line = consoleLogSpy.mock.calls[0]?.[0] as string;
		return JSON.parse(line) as Record<string, unknown>;
	}

	it("emits nothing when NODE_ENV is test (S10)", () => {
		setNodeEnv("test");
		emitActivityLog(
			buildParams({
				durationMs: 12,
				userId: "user-1",
				siren: "123456789",
				ip: "203.0.113.45",
				rawInput: { year: 2026 },
			}),
		);
		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("writes a single JSON line with all 16 contract keys always present (S1)", () => {
		emitActivityLog(
			buildParams({
				durationMs: 84,
				userId: "0b9f6c2e-4d1a-4c3b-9e2f-5a6b7c8d9e01",
				siren: "123456789",
				ip: "203.0.113.45",
				rawInput: { totalMen: 60, totalWomen: 40 },
			}),
		);

		expect(consoleLogSpy).toHaveBeenCalledOnce();
		const entry = parseLastLine();
		expect(Object.keys(entry).sort()).toEqual(
			[
				"timestamp",
				"level",
				"logType",
				"source",
				"action",
				"category",
				"route",
				"operation",
				"status",
				"errorCode",
				"durationMs",
				"userId",
				"siren",
				"ip",
				"input",
				"inputKeys",
			].sort(),
		);
		expect(entry).toMatchObject({
			timestamp: FROZEN_NOW,
			level: "info",
			logType: "user_activity",
			source: "trpc",
			action: "declaration.update_step_1",
			route: "declaration.updateStep1",
			operation: "mutation",
			status: "success",
			ip: "203.0.0.0",
		});
		// Only the *names* of totalMen / totalWomen may appear, never the 40 / 60 figures themselves.
		expect(entry.input).toBeNull();
		expect(entry.inputKeys).toEqual(["totalMen", "totalWomen"]);
		expect(JSON.stringify(entry)).not.toContain("40");
		expect(JSON.stringify(entry)).not.toContain("60");
	});

	it("uses level warn for a failure and keeps the allowlisted route input (§1, 3rd example)", () => {
		emitActivityLog(
			buildParams({
				source: "route",
				action: "pdf.declaration_download",
				category: "read_sensitive",
				route: "/api/declaration-pdf",
				operation: "GET",
				status: "failure",
				errorCode: "HTTP_403",
				durationMs: 31,
				userId: "user-1",
				siren: "123456789",
				ip: "203.0.113.45",
				rawInput: { year: 2026 },
			}),
		);

		expect(parseLastLine()).toMatchObject({
			level: "warn",
			status: "failure",
			input: { year: 2026 },
			inputKeys: ["year"],
		});
	});

	// tRPC input is read before Zod validation: an allowlisted key's value is caller-controlled, so no tRPC line ever carries one.
	it.each([
		{ path: "mapped", action: "representation_declaration.get" },
		{ path: "unmapped", action: null },
	])("writes a null input but keeps inputKeys on a $path tRPC line (S11)", ({
		action,
	}) => {
		emitActivityLog(
			buildParams({
				source: "trpc",
				action,
				rawInput: { year: 2026, declarationId: "decl-forged-1" },
			}),
		);

		const entry = parseLastLine();
		expect(entry.input).toBeNull();
		expect(entry.inputKeys).toEqual(["declarationId", "year"]);
		expect(JSON.stringify(entry)).not.toContain("decl-forged-1");
	});

	it("writes none of the PII values of a tRPC call, only their key names (S4, S5)", () => {
		emitActivityLog(
			buildParams({
				action: "profile.update",
				route: "profile.updateProfile",
				rawInput: PII_LADEN_INPUT,
			}),
		);

		const entry = parseLastLine();
		expect(entry.input).toBeNull();
		expect(entry.inputKeys).toEqual([
			"email",
			"firstName",
			"nested",
			"phone",
			"query",
			"year",
		]);
		for (const value of PII_VALUES) {
			expect(JSON.stringify(entry)).not.toContain(value);
		}
	});

	it.each([
		"route",
		null,
	] as const)("keeps only allowlisted keys with primitive values in `input` for a %s-source line", (source) => {
		emitActivityLog(
			buildParams({
				source,
				action: "cse_opinion.upload_file",
				route: source === "route" ? "/api/upload" : null,
				operation: source === "route" ? "POST" : null,
				rawInput: PII_LADEN_INPUT,
			}),
		);

		const entry = parseLastLine();
		// `year` is the only allowlisted key present with a valid primitive value.
		expect(entry.input).toEqual({ year: 2026 });
		for (const value of PII_VALUES) {
			expect(JSON.stringify(entry)).not.toContain(value);
		}
	});

	it("drops a nested value even under an allowlisted key", () => {
		emitActivityLog(
			buildParams({
				source: "route",
				rawInput: { id: { nested: true }, year: 2026 },
			}),
		);

		expect(parseLastLine().input).toEqual({ year: 2026 });
	});

	it("keeps booleans and short identifiers but drops free text and non-finite numbers from a route input", () => {
		emitActivityLog(
			buildParams({
				source: "route",
				rawInput: {
					hasCse: true,
					declarationId: "7c1e2d3f-0000-4000-8000-000000000042",
					siren: "Société Démo",
					year: Number.NaN,
					page: Number.POSITIVE_INFINITY,
				},
			}),
		);

		expect(parseLastLine().input).toEqual({
			hasCse: true,
			declarationId: "7c1e2d3f-0000-4000-8000-000000000042",
		});
	});

	it("keeps only the file id of an upload failure, never its file or virus name", () => {
		emitActivityLog(
			buildParams({
				source: null,
				action: "cse_opinion.upload_file",
				category: "mutation",
				route: null,
				operation: null,
				status: "failure",
				errorCode: deriveErrorCode("HTTP 422 virus_detected"),
				rawInput: {
					flowType: "cse_opinion",
					fileId: "7c1e2d3f-0000-4000-8000-000000000042",
					fileName: "avis-cse-societe-demo.pdf",
					virusName: "Eicar-Test-Signature",
					s3Cleanup: "ok",
				},
			}),
		);

		const entry = parseLastLine();
		expect(entry).toMatchObject({
			status: "failure",
			errorCode: "HTTP_422",
			input: { fileId: "7c1e2d3f-0000-4000-8000-000000000042" },
			inputKeys: ["fileId", "fileName", "flowType", "s3Cleanup", "virusName"],
		});
		expect(JSON.stringify(entry)).not.toContain("avis-cse-societe-demo.pdf");
		expect(JSON.stringify(entry)).not.toContain("Eicar-Test-Signature");
		expect(JSON.stringify(entry)).not.toContain("virus_detected");
	});

	it("writes null input and inputKeys when no key survives the projection", () => {
		emitActivityLog(
			buildParams({ source: "route", rawInput: { "bad key!": 1 } }),
		);

		const entry = parseLastLine();
		expect(entry.input).toBeNull();
		expect(entry.inputKeys).toBeNull();
	});

	it("caps inputKeys at 20 entries, sorted, dropping malformed key names", () => {
		const rawInput = Object.fromEntries(
			Array.from({ length: 25 }, (_, i) => [
				`key${String(i).padStart(2, "0")}`,
				i,
			]),
		);
		(rawInput as Record<string, unknown>)["bad key!"] = "x";

		emitActivityLog(
			buildParams({
				action: null,
				category: null,
				route: "some.path",
				operation: "query",
				rawInput,
			}),
		);

		const inputKeys = parseLastLine().inputKeys as string[];
		expect(inputKeys).toHaveLength(20);
		expect(inputKeys).toEqual([...inputKeys].sort());
		expect(inputKeys).not.toContain("bad key!");
	});

	it("sorts inputKeys alphabetically regardless of case", () => {
		emitActivityLog(buildParams({ rawInput: { Zeta: 1, alpha: 2, Beta: 3 } }));

		expect(parseLastLine().inputKeys).toEqual(["alpha", "Beta", "Zeta"]);
	});

	it("returns null input/inputKeys when rawInput is not a plain object", () => {
		emitActivityLog(
			buildParams({
				source: "route",
				route: "/api/some-path",
				operation: "GET",
				rawInput: "just-a-string",
			}),
		);

		const entry = parseLastLine();
		expect(entry.input).toBeNull();
		expect(entry.inputKeys).toBeNull();
	});

	it("truncates route to 200 characters", () => {
		const longRoute = `/api/${"a".repeat(250)}`;
		emitActivityLog(
			buildParams({
				source: "route",
				action: "export.download",
				category: "export",
				route: longRoute,
				operation: "GET",
			}),
		);

		expect((parseLastLine().route as string).length).toBe(200);
	});

	it("never throws when JSON serialization fails, and reports the failure (S8)", () => {
		consoleLogSpy.mockImplementation(() => {
			throw new Error("stdout write failed");
		});

		expect(() => emitActivityLog(buildParams())).not.toThrow();
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});
