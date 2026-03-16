import { type Server, createServer } from "node:net";
import { afterAll, describe, expect, it } from "vitest";

let server: Server | undefined;

const STREAM_END = Buffer.alloc(4, 0);

function startMockClamav(reply: string): Promise<number> {
	return new Promise((resolve) => {
		server = createServer((socket) => {
			let received = Buffer.alloc(0);

			socket.on("data", (data) => {
				received = Buffer.concat([received, data]);

				// Detect INSTREAM end marker (4 zero bytes)
				if (
					received.length >= 4 &&
					received.subarray(-4).equals(STREAM_END)
				) {
					socket.end(reply);
				}
			});
		});
		server.listen(0, () => {
			const addr = server?.address();
			resolve(typeof addr === "object" && addr ? addr.port : 0);
		});
	});
}

function stopServer(): Promise<void> {
	return new Promise((resolve) => {
		if (server) {
			server.close(() => resolve());
			server = undefined;
		} else {
			resolve();
		}
	});
}

describe("clamav service", () => {
	afterAll(async () => {
		await stopServer();
	});

	it("returns clean when CLAMAV_HOST is not set", async () => {
		const { env } = await import("~/env");
		const originalHost = env.CLAMAV_HOST;
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: undefined,
			writable: true,
			configurable: true,
		});

		const { scanBuffer } = await import("../clamav");
		const result = await scanBuffer(Buffer.from("test"));
		expect(result.clean).toBe(true);

		Object.defineProperty(env, "CLAMAV_HOST", {
			value: originalHost,
			writable: true,
			configurable: true,
		});
	});

	it("returns clean for an OK reply", async () => {
		const port = await startMockClamav("stream: OK\0");

		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "127.0.0.1",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: port,
			writable: true,
			configurable: true,
		});

		const { scanBuffer } = await import("../clamav");
		const result = await scanBuffer(Buffer.from("clean content"));

		expect(result.clean).toBe(true);

		await stopServer();
	});

	it("returns infected for a FOUND reply", async () => {
		const port = await startMockClamav("stream: Eicar-Signature FOUND\0");

		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "127.0.0.1",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: port,
			writable: true,
			configurable: true,
		});

		const { scanBuffer } = await import("../clamav");
		const result = await scanBuffer(Buffer.from("infected"));

		expect(result.clean).toBe(false);
		if (!result.clean) {
			expect(result.virus).toBe("Eicar-Signature");
		}

		await stopServer();
	});

	it("throws when ClamAV is unreachable", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "127.0.0.1",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: 19999,
			writable: true,
			configurable: true,
		});

		const { scanBuffer } = await import("../clamav");

		await expect(scanBuffer(Buffer.from("test"))).rejects.toThrow(
			"ClamAV connection failed",
		);
	});
});
