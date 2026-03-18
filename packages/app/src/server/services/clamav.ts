import "server-only";

import net from "node:net";

import { env } from "~/env";

export type ScanResult = { clean: true } | { clean: false; virus: string };

const SCAN_TIMEOUT_MS = 30_000;

/**
 * Opens a TCP connection to clamd and sends the INSTREAM command.
 *
 * Protocol:
 *   → zINSTREAM\0
 *   → [4 bytes big-endian = chunk size][chunk data]  (repeated)
 *   → [4 bytes zero]                                 (end of stream)
 *   ← "stream: OK\0"  or  "stream: <virus> FOUND\0"
 */
export function createClamdStream(host: string, port: number) {
	const socket = net.createConnection({ host, port });

	let socketError: Error | null = null;
	socket.on("error", (err) => {
		socketError = err;
	});

	// Send the INSTREAM command (null-terminated)
	socket.write("zINSTREAM\0");

	return {
		/**
		 * Sends a chunk to clamd with backpressure handling.
		 * Each chunk is prefixed with a 4-byte big-endian size header.
		 */
		async sendChunk(data: Buffer) {
			if (socketError) throw socketError;

			const sizeHeader = Buffer.alloc(4);
			sizeHeader.writeUInt32BE(data.length, 0);

			socket.write(sizeHeader);
			const flushed = socket.write(data);

			if (!flushed) {
				await new Promise<void>((resolve, reject) => {
					socket.once("drain", resolve);
					socket.once("error", reject);
				});
			}
		},

		/**
		 * Signals end of stream and waits for the scan verdict.
		 * Sends 4 zero-bytes then reads the response.
		 */
		finish(): Promise<ScanResult> {
			if (socketError) return Promise.reject(socketError);

			return new Promise((resolve, reject) => {
				socket.write(Buffer.alloc(4, 0));

				let response = "";
				socket.on("data", (chunk) => {
					response += chunk.toString();
				});

				socket.on("end", () => {
					const cleaned = response.replace(/\0/g, "").trim();
					if (cleaned.endsWith("OK")) {
						resolve({ clean: true });
					} else {
						const match = cleaned.match(/stream: (\S+) FOUND/);
						resolve({
							clean: false,
							virus: match?.[1] ?? "unknown",
						});
					}
				});

				socket.on("error", reject);

				socket.setTimeout(SCAN_TIMEOUT_MS, () => {
					socket.destroy();
					reject(new Error("clamd scan timeout"));
				});
			});
		},

		/** Closes the socket (call in all error paths). */
		destroy() {
			socket.destroy();
		},
	};
}

/**
 * Convenience wrapper: scan a complete buffer using the INSTREAM protocol.
 */
export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
	const clamd = createClamdStream(env.CLAMAV_HOST, env.CLAMAV_PORT);

	try {
		await clamd.sendChunk(buffer);
		return await clamd.finish();
	} catch (err) {
		clamd.destroy();
		throw err;
	}
}
