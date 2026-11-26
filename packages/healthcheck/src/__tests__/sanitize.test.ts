import { describe, expect, it } from "vitest";

import { sanitizeMessage } from "../sanitize.js";

describe("sanitizeMessage", () => {
	it("keeps the message of an Error and never its stack", () => {
		const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");

		const message = sanitizeMessage(error);

		expect(message).toBe("connect ECONNREFUSED 127.0.0.1:5432");
		expect(message).not.toContain("at ");
	});

	it("redacts every configured secret it finds", () => {
		const message = sanitizeMessage(
			new Error(
				"AWS says AKIAIOSFODNN7EXAMPLE is unknown and wJalrXUtnFEMI is wrong",
			),
			["AKIAIOSFODNN7EXAMPLE", "wJalrXUtnFEMI"],
		);

		expect(message).toBe(
			"AWS says [redacted] is unknown and [redacted] is wrong",
		);
	});

	it("ignores secrets too short to be distinctive", () => {
		expect(sanitizeMessage(new Error("bucket egapro is down"), ["pw"])).toBe(
			"bucket egapro is down",
		);
	});

	it("drops URL credentials, path and query string", () => {
		const credentials = ["svc", "hunter2"].join(":");
		const signedUrl = `https://${credentials}${"@"}minio.local:9000/egapro?X-Amz-Signature=deadbeef`;

		const message = sanitizeMessage(new Error(`failed GET ${signedUrl}`));

		expect(message).toBe("failed GET https://minio.local:9000");
	});

	it("redacts long opaque tokens", () => {
		const token = "a".repeat(40);

		const message = sanitizeMessage(new Error(`token ${token} rejected`));

		expect(message).toBe("token [redacted] rejected");
	});

	it("flattens control characters and trims", () => {
		expect(sanitizeMessage(new Error("  boom\n\tagain  "))).toBe("boom again");
	});

	it("truncates a message longer than 200 characters", () => {
		const message = sanitizeMessage(
			new Error("failure while probing ".repeat(20)),
		);

		expect(message).toHaveLength(200);
		expect(message.endsWith("…")).toBe(true);
	});

	it("reads a message off a non-Error object", () => {
		expect(sanitizeMessage({ message: "Forbidden" })).toBe("Forbidden");
		expect(sanitizeMessage("plain string")).toBe("plain string");
	});

	it("falls back to the error code when the message is empty", () => {
		expect(
			sanitizeMessage(Object.assign(new Error(""), { code: "ECONNREFUSED" })),
		).toBe("ECONNREFUSED");
		expect(sanitizeMessage({ code: "AXIOS" })).toBe("AXIOS");
	});

	it("falls back to a generic message for an unknowable error", () => {
		expect(sanitizeMessage({})).toBe("unknown error");
		expect(sanitizeMessage(undefined)).toBe("unknown error");
	});
});
