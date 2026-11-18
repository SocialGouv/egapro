import { describeError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const PROCONNECT_TIMEOUT_MS = 5000;
const DISCOVERY_PATH = "/.well-known/openid-configuration";

export type ProconnectProbeOptions = {
	issuer: string | null;
	secrets: readonly string[];
	intervalSeconds: number;
	timeoutMs?: number;
};

export function createProconnectProbe({
	issuer,
	secrets,
	intervalSeconds,
	timeoutMs = PROCONNECT_TIMEOUT_MS,
}: ProconnectProbeOptions): Probe {
	return {
		key: "proconnect",
		label: "ProConnect (connexion)",
		criticality: "critical",
		kind: "partner",
		intervalSeconds,
		timeoutMs,
		async probe(signal) {
			if (!issuer) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			try {
				const response = await fetch(
					`${trimTrailingSlash(issuer)}${DISCOVERY_PATH}`,
					{
						headers: { Accept: "application/json" },
						signal,
					},
				);

				if (!response.ok) {
					return {
						status: statusFromHttpStatus(response.status),
						latencyMs: elapsed(),
						message: `le document de découverte répond ${response.status}`,
					};
				}

				const document: unknown = await response.json();

				return hasDiscoveryEndpoints(document)
					? { status: "operational", latencyMs: elapsed() }
					: {
							status: "misconfigured",
							latencyMs: elapsed(),
							message: "document de découverte incomplet",
						};
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(
						error,
						secrets,
						"connexion à ProConnect impossible",
					),
				};
			}
		},
	};
}

function hasDiscoveryEndpoints(document: unknown): boolean {
	if (typeof document !== "object" || document === null) return false;
	const { authorization_endpoint, jwks_uri } = document as Record<
		string,
		unknown
	>;
	return isNonEmptyString(authorization_endpoint) && isNonEmptyString(jwks_uri);
}

function isNonEmptyString(value: unknown): boolean {
	return typeof value === "string" && value.length > 0;
}

function statusFromHttpStatus(status: number): ProbeStatus {
	return status >= 500 ? "unavailable" : "misconfigured";
}

function trimTrailingSlash(value: string): string {
	return value.replace(/\/$/, "");
}
