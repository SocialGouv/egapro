import net from "node:net";

import { describeError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe } from "./types.js";

const CLAMAV_TIMEOUT_MS = 5000;
const CLAMAV_INTERVAL_SECONDS = 60;

export type ClamavConnectionConfig = {
	host: string;
	port: number;
};

export type ClamavProbeOptions = {
	connection: ClamavConnectionConfig | null;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
};

export function createClamavProbe({
	connection,
	secrets,
	intervalSeconds = CLAMAV_INTERVAL_SECONDS,
	timeoutMs = CLAMAV_TIMEOUT_MS,
}: ClamavProbeOptions): Probe {
	return {
		key: "clamav",
		label: "ClamAV (antivirus)",
		criticality: "critical",
		kind: "internal",
		intervalSeconds,
		timeoutMs,
		async probe(signal) {
			if (!connection) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			try {
				const reply = await pingClamd({
					host: connection.host,
					port: connection.port,
					signal,
				});

				return reply.includes("PONG")
					? { status: "operational", latencyMs: elapsed() }
					: {
							status: "unavailable",
							latencyMs: elapsed(),
							message: "réponse inattendue de clamd",
						};
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(error, secrets),
				};
			}
		},
	};
}

export function pingClamd({
	host,
	port,
	signal,
}: ClamavConnectionConfig & { signal: AbortSignal }): Promise<string> {
	return new Promise((resolve, reject) => {
		const socket = net.createConnection({ host, port });
		let settled = false;

		const finish = (settle: () => void) => {
			if (settled) return;
			settled = true;
			signal.removeEventListener("abort", onAbort);
			socket.destroy();
			settle();
		};

		const onAbort = () => finish(() => reject(new Error("clamd ping aborted")));

		socket.setEncoding("utf8");
		socket.once("connect", () => socket.write("PING\n"));
		socket.once("data", (chunk: string) => finish(() => resolve(chunk.trim())));
		socket.once("error", (error: Error) => finish(() => reject(error)));
		socket.once("end", () =>
			finish(() =>
				reject(new Error("clamd closed the connection without replying")),
			),
		);

		signal.addEventListener("abort", onAbort, { once: true });
		if (signal.aborted) onAbort();
	});
}
