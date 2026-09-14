import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Overrides the global `~/env` mock (which pins NODE_ENV to "test", see
// `src/test/setup.ts`) so `emitActivityLog`'s test-env guard can be exercised
// in both directions within this file.
vi.mock("~/env", () => ({ env: { NODE_ENV: "production" } }));

const { emitActivityLog, deriveErrorCode, truncateIp } = await import(
	"../activityLog"
);
const { env } = await import("~/env");

/** The mocked `~/env` module types `NODE_ENV` as readonly — cast locally to flip it per-test. */
function setNodeEnv(value: "test" | "production"): void {
	(env as { NODE_ENV: string }).NODE_ENV = value;
}

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
		setNodeEnv("production");
	});

	function parseLastLine(): Record<string, unknown> {
		const line = consoleLogSpy.mock.calls[0]?.[0] as string;
		return JSON.parse(line) as Record<string, unknown>;
	}

	it("emits nothing when NODE_ENV is test (S10)", () => {
		setNodeEnv("test");
		emitActivityLog({
			source: "trpc",
			action: "declaration.update_step_1",
			category: "mutation",
			route: "declaration.updateStep1",
			operation: "mutation",
			status: "success",
			errorCode: null,
			durationMs: 12,
			userId: "user-1",
			siren: "123456789",
			ip: "203.0.113.45",
			rawInput: { year: 2026 },
		});
		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("writes a single JSON line with all 16 contract keys always present (S1)", () => {
		emitActivityLog({
			source: "trpc",
			action: "declaration.update_step_1",
			category: "mutation",
			route: "declaration.updateStep1",
			operation: "mutation",
			status: "success",
			errorCode: null,
			durationMs: 84,
			userId: "0b9f6c2e-4d1a-4c3b-9e2f-5a6b7c8d9e01",
			siren: "123456789",
			ip: "203.0.113.45",
			rawInput: { totalMen: 60, totalWomen: 40 },
		});

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
			level: "info",
			logType: "user_activity",
			source: "trpc",
			action: "declaration.update_step_1",
			route: "declaration.updateStep1",
			operation: "mutation",
			status: "success",
			ip: "203.0.0.0",
		});
		// totalMen / totalWomen are not in the value allowlist — only their
		// *names* may appear, never the 40 / 60 figures themselves (S1).
		expect(entry.input).toBeNull();
		expect(entry.inputKeys).toEqual(["totalMen", "totalWomen"]);
		expect(JSON.stringify(entry)).not.toContain("40");
		expect(JSON.stringify(entry)).not.toContain("60");
	});

	it("uses level warn for a failure and info for a success", () => {
		emitActivityLog({
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
		});

		expect(parseLastLine()).toMatchObject({ level: "warn", status: "failure" });
	});

	it("keeps only allowlisted keys — and only primitive values — in `input` (S4, S5)", () => {
		emitActivityLog({
			source: "trpc",
			action: "profile.update",
			category: "mutation",
			route: "profile.updateProfile",
			operation: "mutation",
			status: "success",
			errorCode: null,
			durationMs: 5,
			userId: "user-1",
			siren: null,
			ip: null,
			rawInput: {
				phone: "0600000000",
				firstName: "Camille",
				email: "email@example.fr",
				query: "Société Démo",
				year: 2026,
				nested: { declarationId: "should-not-leak" },
			},
		});

		const entry = parseLastLine();
		// `year` is the only allowlisted key present with a valid primitive value.
		expect(entry.input).toEqual({ year: 2026 });
		expect(JSON.stringify(entry)).not.toContain("0600000000");
		expect(JSON.stringify(entry)).not.toContain("Camille");
		expect(JSON.stringify(entry)).not.toContain("email@example.fr");
		expect(JSON.stringify(entry)).not.toContain("Société Démo");
	});

	it("drops a nested value even under an allowlisted key", () => {
		emitActivityLog({
			source: "trpc",
			action: "declaration.update_step_1",
			category: "mutation",
			route: "declaration.updateStep1",
			operation: "mutation",
			status: "success",
			errorCode: null,
			durationMs: 5,
			userId: null,
			siren: null,
			ip: null,
			rawInput: { id: { nested: true }, year: 2026 },
		});

		expect(parseLastLine().input).toEqual({ year: 2026 });
	});

	it("caps inputKeys at 20 entries, sorted, dropping malformed key names", () => {
		const rawInput = Object.fromEntries(
			Array.from({ length: 25 }, (_, i) => [
				`key${String(i).padStart(2, "0")}`,
				i,
			]),
		);
		(rawInput as Record<string, unknown>)["bad key!"] = "x";

		emitActivityLog({
			source: "trpc",
			action: null,
			category: null,
			route: "some.path",
			operation: "query",
			status: "success",
			errorCode: null,
			durationMs: 1,
			userId: null,
			siren: null,
			ip: null,
			rawInput,
		});

		const inputKeys = parseLastLine().inputKeys as string[];
		expect(inputKeys).toHaveLength(20);
		expect(inputKeys).toEqual([...inputKeys].sort());
		expect(inputKeys).not.toContain("bad key!");
	});

	it("returns null input/inputKeys when rawInput is not a plain object", () => {
		emitActivityLog({
			source: "trpc",
			action: null,
			category: null,
			route: "some.path",
			operation: "query",
			status: "success",
			errorCode: null,
			durationMs: 1,
			userId: null,
			siren: null,
			ip: null,
			rawInput: "just-a-string",
		});

		const entry = parseLastLine();
		expect(entry.input).toBeNull();
		expect(entry.inputKeys).toBeNull();
	});

	it("truncates route to 200 characters", () => {
		const longRoute = `/api/${"a".repeat(250)}`;
		emitActivityLog({
			source: "route",
			action: "export.download",
			category: "export",
			route: longRoute,
			operation: "GET",
			status: "success",
			errorCode: null,
			durationMs: 1,
			userId: null,
			siren: null,
			ip: null,
			rawInput: null,
		});

		expect((parseLastLine().route as string).length).toBe(200);
	});

	it("never throws when JSON serialization fails, and reports the failure (S8)", () => {
		consoleLogSpy.mockImplementation(() => {
			throw new Error("stdout write failed");
		});

		expect(() =>
			emitActivityLog({
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
			}),
		).not.toThrow();
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});
