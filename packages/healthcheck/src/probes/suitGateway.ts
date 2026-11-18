import { describeError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const SUIT_TIMEOUT_MS = 10_000;
const SUIT_HEALTH_PATH = "/api/v1/healthz";

export type SuitGatewayConfig = {
	baseUrl: string;
	apiKey: string;
};

export type SuitGatewayProbeOptions = {
	connection: SuitGatewayConfig | null;
	secrets: readonly string[];
	intervalSeconds: number;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
};

export function createSuitGatewayProbe({
	connection,
	secrets,
	intervalSeconds,
	timeoutMs = SUIT_TIMEOUT_MS,
	fetchImpl = fetch,
}: SuitGatewayProbeOptions): Probe {
	return {
		key: "suit-gateway",
		label: "Passerelle SUIT (APISIX)",
		criticality: "important",
		kind: "exposed",
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
				const response = await fetchImpl(
					new URL(SUIT_HEALTH_PATH, connection.baseUrl),
					{
						headers: {
							Accept: "application/json",
							Authorization: `Bearer ${connection.apiKey}`,
						},
						signal,
					},
				);

				const status = statusFromHttp(response.status);
				if (status === "operational") {
					return { status, latencyMs: elapsed() };
				}

				return {
					status,
					latencyMs: elapsed(),
					message: isAuthenticationFailure(response.status)
						? "clé du consumer de supervision refusée"
						: `la passerelle SUIT répond ${response.status}`,
				};
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(
						error,
						secrets,
						"connexion à la passerelle SUIT impossible",
					),
				};
			}
		},
	};
}

function statusFromHttp(status: number): ProbeStatus {
	if (status >= 500) return "unavailable";
	if (status >= 400) return "misconfigured";
	return "operational";
}

function isAuthenticationFailure(status: number): boolean {
	return status === 401 || status === 403;
}
