import "server-only";

import { Socket } from "node:net";

import { env } from "~/env";

type ScanResult =
	| { clean: true }
	| { clean: false; virus: string };

/**
 * Scan a buffer for viruses using ClamAV INSTREAM protocol.
 * If ClamAV is not configured (CLAMAV_HOST not set), returns clean.
 * If ClamAV is unreachable, throws an error.
 */
export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
	if (!env.CLAMAV_HOST) {
		return { clean: true };
	}

	const reply = await sendInstream(buffer, env.CLAMAV_HOST, env.CLAMAV_PORT);

	if (reply.includes("OK") && !reply.includes("FOUND")) {
		return { clean: true };
	}

	const virus = reply
		.replace(/^stream:\s*/, "")
		.replace(/\s*FOUND\s*$/, "")
		.trim();

	return { clean: false, virus: virus || "Unknown" };
}

const INSTREAM_COMMAND = Buffer.from("zINSTREAM\0");
const CHUNK_SIZE = 8192;
const STREAM_END = Buffer.alloc(4, 0);
const SCAN_TIMEOUT = 30_000;

/**
 * Send a buffer to ClamAV using the INSTREAM protocol over TCP.
 *
 * Protocol:
 * 1. Send "zINSTREAM\0"
 * 2. Send chunks: [4-byte big-endian length][data]
 * 3. Send 4 zero bytes to signal end
 * 4. Read response
 */
function sendInstream(
	buffer: Buffer,
	host: string,
	port: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const socket = new Socket();
		const chunks: Buffer[] = [];

		socket.setTimeout(SCAN_TIMEOUT);

		socket.on("data", (data) => {
			chunks.push(data);
		});

		socket.on("end", () => {
			const reply = Buffer.concat(chunks).toString("utf-8").replace(/\0/g, "");
			resolve(reply.trim());
		});

		socket.on("timeout", () => {
			socket.destroy();
			reject(new Error(`ClamAV scan timed out after ${SCAN_TIMEOUT}ms`));
		});

		socket.on("error", (err) => {
			reject(
				new Error(`ClamAV connection failed: ${err.message}`),
			);
		});

		socket.connect(port, host, () => {
			socket.write(INSTREAM_COMMAND);

			for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
				const chunk = buffer.subarray(offset, offset + CHUNK_SIZE);
				const lengthHeader = Buffer.alloc(4);
				lengthHeader.writeUInt32BE(chunk.length);
				socket.write(lengthHeader);
				socket.write(chunk);
			}

			socket.write(STREAM_END);
		});
	});
}
