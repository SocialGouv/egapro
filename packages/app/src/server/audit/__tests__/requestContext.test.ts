import { describe, expect, it } from "vitest";
import {
	buildRequestContext,
	extractIpAddress,
	extractUserAgent,
} from "../requestContext";

describe("extractIpAddress", () => {
	it("prefers x-real-ip, set by the ingress, over x-forwarded-for", () => {
		const headers = new Headers({
			"x-real-ip": "198.51.100.9",
			"x-forwarded-for": "203.0.113.1, 198.51.100.1",
		});
		expect(extractIpAddress(headers)).toBe("198.51.100.9");
	});

	it("falls back on the last x-forwarded-for entry when x-real-ip is invalid", () => {
		const headers = new Headers({
			"x-real-ip": "not-an-ip",
			"x-forwarded-for": "203.0.113.1, 198.51.100.1",
		});
		expect(extractIpAddress(headers)).toBe("198.51.100.1");
	});

	it("takes the last x-forwarded-for entry, the one appended by our proxy", () => {
		const headers = new Headers({
			"x-forwarded-for": "203.0.113.1, 198.51.100.1",
		});
		expect(extractIpAddress(headers)).toBe("198.51.100.1");
	});

	it("trims whitespace around the forwarded entry", () => {
		const headers = new Headers({ "x-forwarded-for": "  203.0.113.7  " });
		expect(extractIpAddress(headers)).toBe("203.0.113.7");
	});

	it("falls back to x-real-ip when x-forwarded-for is missing", () => {
		const headers = new Headers({ "x-real-ip": "10.0.0.42" });
		expect(extractIpAddress(headers)).toBe("10.0.0.42");
	});

	it("accepts an IPv6 address", () => {
		const headers = new Headers({ "x-real-ip": "2001:db8::1" });
		expect(extractIpAddress(headers)).toBe("2001:db8::1");
	});

	it("accepts the longest textual IPv6 form, 45 characters", () => {
		const longest = "ffff:ffff:ffff:ffff:ffff:ffff:255.255.255.255";
		expect(longest).toHaveLength(45);
		const headers = new Headers({ "x-real-ip": longest });
		expect(extractIpAddress(headers)).toBe(longest);
	});

	it.each([
		["a value that is not an IP address", "not-an-ip"],
		[
			"a value longer than the 45-character column",
			`203.0.113.1${"0".repeat(60)}`,
		],
		["an IPv6 address with a long zone id", `fe80::1%${"a".repeat(60)}`],
	])("returns null for %s", (_label, value) => {
		expect(extractIpAddress(new Headers({ "x-real-ip": value }))).toBeNull();
		expect(
			extractIpAddress(new Headers({ "x-forwarded-for": value })),
		).toBeNull();
	});

	it("returns null when no IP header is present", () => {
		expect(extractIpAddress(new Headers())).toBeNull();
	});
});

describe("extractUserAgent", () => {
	it("returns the user-agent header value", () => {
		const headers = new Headers({ "user-agent": "Mozilla/5.0" });
		expect(extractUserAgent(headers)).toBe("Mozilla/5.0");
	});

	it("returns null when missing", () => {
		expect(extractUserAgent(new Headers())).toBeNull();
	});
});

describe("buildRequestContext", () => {
	it("aggregates IP and user-agent in one call", () => {
		const headers = new Headers({
			"x-forwarded-for": "203.0.113.5",
			"user-agent": "TestAgent",
		});
		expect(buildRequestContext(headers)).toEqual({
			ipAddress: "203.0.113.5",
			userAgent: "TestAgent",
		});
	});
});
