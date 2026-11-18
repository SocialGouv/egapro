import { createClient, type RedisClientType } from "redis";

import { describeError, isAuthenticationError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const VALKEY_TIMEOUT_MS = 5000;
const VALKEY_INTERVAL_SECONDS = 60;
const VALKEY_CONNECT_TIMEOUT_MS = 1500;

export type ValkeyProbeOptions = {
	url: string | null;
	secrets: readonly string[];
	createValkeyClient?: (url: string) => RedisClientType;
	intervalSeconds?: number;
	timeoutMs?: number;
};

export function createValkeyProbe({
	url,
	secrets,
	createValkeyClient = defaultValkeyClient,
	intervalSeconds = VALKEY_INTERVAL_SECONDS,
	timeoutMs = VALKEY_TIMEOUT_MS,
}: ValkeyProbeOptions): Probe {
	return {
		key: "valkey",
		label: "Valkey (cache et quotas)",
		criticality: "critical",
		kind: "internal",
		intervalSeconds,
		timeoutMs,
		async probe() {
			if (!url) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			const client = createValkeyClient(url);
			client.on("error", () => undefined);

			try {
				await client.connect();
				const reply = await client.ping();

				return reply === "PONG"
					? { status: "operational", latencyMs: elapsed() }
					: {
							status: "unavailable",
							latencyMs: elapsed(),
							message: "réponse inattendue de Valkey",
						};
			} catch (error) {
				return {
					status: statusFromError(error),
					latencyMs: elapsed(),
					message: describeError(
						error,
						secrets,
						"connexion à Valkey impossible",
					),
				};
			} finally {
				client.destroy();
			}
		},
	};
}

function defaultValkeyClient(url: string): RedisClientType {
	return createClient({
		url,
		socket: { connectTimeout: VALKEY_CONNECT_TIMEOUT_MS },
	}) as RedisClientType;
}

function statusFromError(error: unknown): ProbeStatus {
	return isAuthenticationError(error) ? "misconfigured" : "unavailable";
}
