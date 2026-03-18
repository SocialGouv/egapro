import net from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:net", () => {
	const socket = {
		write: vi.fn().mockReturnValue(true),
		on: vi.fn(),
		once: vi.fn(),
		destroy: vi.fn(),
		setTimeout: vi.fn(),
	};
	return {
		default: {
			createConnection: vi.fn().mockReturnValue(socket),
		},
	};
});

function getSocket() {
	return vi.mocked(net.createConnection).mock.results[0]
		?.value as net.Socket & {
		write: ReturnType<typeof vi.fn>;
		on: ReturnType<typeof vi.fn>;
		once: ReturnType<typeof vi.fn>;
		destroy: ReturnType<typeof vi.fn>;
		setTimeout: ReturnType<typeof vi.fn>;
	};
}

describe("clamav service", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns clean for an uninfected file", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "localhost",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: 3310,
			writable: true,
			configurable: true,
		});

		const { scanBuffer } = await import("../clamav");
		const promise = scanBuffer(Buffer.from("clean"));

		const socket = getSocket();

		const onHandlers = new Map<string, (...args: unknown[]) => void>();
		socket.on.mockImplementation(
			(event: string, handler: (...args: unknown[]) => void) => {
				onHandlers.set(event, handler);
				if (event === "end") {
					setTimeout(() => {
						onHandlers.get("data")?.(Buffer.from("stream: OK\0"));
						onHandlers.get("end")?.();
					}, 0);
				}
				return socket;
			},
		);

		const result = await promise;
		expect(result.clean).toBe(true);
		expect(net.createConnection).toHaveBeenCalledWith({
			host: "localhost",
			port: 3310,
		});
	});

	it("returns infected for a FOUND reply", async () => {
		const { env } = await import("~/env");
		Object.defineProperty(env, "CLAMAV_HOST", {
			value: "localhost",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(env, "CLAMAV_PORT", {
			value: 3310,
			writable: true,
			configurable: true,
		});

		const { scanBuffer } = await import("../clamav");
		const promise = scanBuffer(Buffer.from("infected"));

		const socket = getSocket();
		const onHandlers = new Map<string, (...args: unknown[]) => void>();
		socket.on.mockImplementation(
			(event: string, handler: (...args: unknown[]) => void) => {
				onHandlers.set(event, handler);
				if (event === "end") {
					setTimeout(() => {
						onHandlers.get("data")?.(
							Buffer.from("stream: Eicar-Signature FOUND\0"),
						);
						onHandlers.get("end")?.();
					}, 0);
				}
				return socket;
			},
		);

		const result = await promise;
		expect(result.clean).toBe(false);
		if (!result.clean) {
			expect(result.virus).toBe("Eicar-Signature");
		}
	});

	it("creates a clamd stream with INSTREAM command", async () => {
		const { createClamdStream } = await import("../clamav");
		const clamd = createClamdStream("localhost", 3310);

		const socket = getSocket();
		expect(socket.write).toHaveBeenCalledWith("zINSTREAM\0");

		await clamd.sendChunk(Buffer.from("test"));

		// Verify size header was sent (4 bytes big-endian)
		const sizeHeader = Buffer.alloc(4);
		sizeHeader.writeUInt32BE(4, 0);
		expect(socket.write).toHaveBeenCalledWith(sizeHeader);
		expect(socket.write).toHaveBeenCalledWith(Buffer.from("test"));

		clamd.destroy();
		expect(socket.destroy).toHaveBeenCalled();
	});
});
