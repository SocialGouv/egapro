import { describeError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const WEEZ_TIMEOUT_MS = 10_000;
const WEEZ_FIND_BY_SIREN_PATH = "/public/v3/unitelegale/findbysiren";

export type WeezConnectionConfig = {
	apiUrl: string;
	referenceSiren: string;
};

export type WeezProbeOptions = {
	connection: WeezConnectionConfig | null;
	secrets: readonly string[];
	intervalSeconds: number;
	timeoutMs?: number;
};

export function createWeezProbe({
	connection,
	secrets,
	intervalSeconds,
	timeoutMs = WEEZ_TIMEOUT_MS,
}: WeezProbeOptions): Probe {
	return {
		key: "weez",
		label: "WEEZ (registre Sirene)",
		criticality: "important",
		kind: "partner",
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
				const response = await fetch(
					findBySirenUrl(connection.apiUrl, connection.referenceSiren),
					{
						headers: { Accept: "application/json" },
						// A probe that shared a cache with the application would stay
						// green for a day after the partner went down.
						cache: "no-store",
						signal,
					},
				);

				if (!response.ok) {
					return {
						status: statusFromHttpStatus(response.status),
						latencyMs: elapsed(),
						message: `l'API WEEZ répond ${response.status}`,
					};
				}

				const payload: unknown = await response.json();

				return answeredForReferenceSiren(payload, connection.referenceSiren)
					? { status: "operational", latencyMs: elapsed() }
					: {
							status: "misconfigured",
							latencyMs: elapsed(),
							message: "réponse WEEZ sans le SIREN de référence",
						};
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(error, secrets, "connexion à WEEZ impossible"),
				};
			}
		},
	};
}

function findBySirenUrl(apiUrl: string, siren: string): URL {
	const url = new URL(`${apiUrl.replace(/\/$/, "")}${WEEZ_FIND_BY_SIREN_PATH}`);
	url.searchParams.set("siren", siren);
	url.searchParams.set("page", "0");
	url.searchParams.set("inclure_non_diffusibles", "true");
	url.searchParams.set("inclure_cesse", "true");
	return url;
}

function answeredForReferenceSiren(payload: unknown, siren: string): boolean {
	if (typeof payload !== "object" || payload === null) return false;
	const { content } = payload as { content?: unknown };
	if (!Array.isArray(content)) return false;
	const entity = content[0];
	if (typeof entity !== "object" || entity === null) return false;
	return (entity as { siren?: unknown }).siren === siren;
}

function statusFromHttpStatus(status: number): ProbeStatus {
	return status >= 500 ? "unavailable" : "misconfigured";
}
