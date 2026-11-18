import { describeError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const PUBLIC_API_TIMEOUT_MS = 10_000;
const PUBLIC_API_PATH = "/api/public/openapi.json";

export type PublicApiProbeOptions = {
	publicUrl: string | null;
	secrets: readonly string[];
	intervalSeconds: number;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
};

export function createPublicApiProbe({
	publicUrl,
	secrets,
	intervalSeconds,
	timeoutMs = PUBLIC_API_TIMEOUT_MS,
	fetchImpl = fetch,
}: PublicApiProbeOptions): Probe {
	return {
		key: "public-api",
		label: "API publique via l'ingress",
		criticality: "important",
		kind: "exposed",
		intervalSeconds,
		timeoutMs,
		async probe(signal) {
			if (!publicUrl) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			try {
				const response = await fetchImpl(new URL(PUBLIC_API_PATH, publicUrl), {
					headers: { Accept: "application/json" },
					signal,
				});

				const status = statusFromHttp(response.status);
				if (status !== null) {
					return {
						status,
						latencyMs: elapsed(),
						message: `l'API publique répond ${response.status}`,
					};
				}

				return isJson(response)
					? { status: "operational", latencyMs: elapsed() }
					: {
							status: "degraded",
							latencyMs: elapsed(),
							message: "réponse non JSON",
						};
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(
						error,
						secrets,
						"connexion à l'API publique impossible",
					),
				};
			}
		},
	};
}

function statusFromHttp(status: number): ProbeStatus | null {
	if (status >= 500) return "unavailable";
	if (status >= 400) return "misconfigured";
	return null;
}

function isJson(response: Response): boolean {
	return (response.headers.get("content-type") ?? "")
		.toLowerCase()
		.includes("application/json");
}
