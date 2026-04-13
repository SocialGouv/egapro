import { describe, expect, it } from "vitest";
import {
	buildRequestContext,
	extractIpAddress,
	extractUserAgent,
} from "../requestContext";

describe("extractIpAddress", () => {
	it("returns the first entry of x-forwarded-for", () => {
		const headers = new Headers({
			"x-forwarded-for": "203.0.113.1, 198.51.100.1",
		});
		expect(extractIpAddress(headers)).toBe("203.0.113.1");
	});

	it("trims whitespace around the forwarded entry", () => {
		const headers = new Headers({ "x-forwarded-for": "  203.0.113.7  " });
		expect(extractIpAddress(headers)).toBe("203.0.113.7");
	});

	it("falls back to x-real-ip when x-forwarded-for is missing", () => {
		const headers = new Headers({ "x-real-ip": "10.0.0.42" });
		expect(extractIpAddress(headers)).toBe("10.0.0.42");
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
