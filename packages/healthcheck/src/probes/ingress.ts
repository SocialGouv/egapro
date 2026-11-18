import tls from "node:tls";

import { describeError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const INGRESS_TIMEOUT_MS = 10_000;
const CERTIFICATE_TIMEOUT_MS = 5000;
const DAY_MS = 86_400_000;

export type CertificateDeadline = {
	validTo: Date;
};

export type IngressProbeOptions = {
	publicUrl: string | null;
	secrets: readonly string[];
	intervalSeconds: number;
	certWarnDays: number;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
	readCertificate?: (url: URL) => Promise<CertificateDeadline | null>;
	now?: () => Date;
};

export function createIngressProbe({
	publicUrl,
	secrets,
	intervalSeconds,
	certWarnDays,
	timeoutMs = INGRESS_TIMEOUT_MS,
	fetchImpl = fetch,
	readCertificate = readPeerCertificate,
	now = () => new Date(),
}: IngressProbeOptions): Probe {
	return {
		key: "ingress",
		label: "Application via l'ingress public",
		criticality: "critical",
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

			const rootUrl = new URL("/", publicUrl);
			const elapsed = startTimer();
			try {
				const response = await fetchImpl(rootUrl, {
					redirect: "manual",
					headers: { Accept: "text/html" },
					signal,
				});

				const httpStatus = statusFromHttp(response.status);
				if (httpStatus !== null) {
					return {
						status: httpStatus,
						latencyMs: elapsed(),
						message: `l'ingress répond ${response.status}`,
					};
				}

				if (rootUrl.protocol !== "https:") {
					return { status: "operational", latencyMs: elapsed() };
				}

				const certificate = await readCertificate(rootUrl);
				const verdict = certificateVerdict(certificate, certWarnDays, now());
				return {
					status: verdict.status,
					latencyMs: elapsed(),
					message: verdict.message,
				};
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(
						error,
						secrets,
						"connexion à l'ingress impossible",
					),
				};
			}
		},
	};
}

function statusFromHttp(status: number): ProbeStatus | null {
	if (status >= 500) return "unavailable";
	if (status >= 400) return "degraded";
	return null;
}

function certificateVerdict(
	certificate: CertificateDeadline | null,
	warnDays: number,
	at: Date,
): { status: ProbeStatus; message?: string } {
	if (!certificate) return { status: "operational" };

	const remainingMs = certificate.validTo.getTime() - at.getTime();
	if (remainingMs <= 0) {
		return {
			status: "unavailable",
			message: `certificat TLS expiré le ${formatDate(certificate.validTo)}`,
		};
	}
	if (remainingMs <= warnDays * DAY_MS) {
		return {
			status: "degraded",
			message: `certificat TLS expire le ${formatDate(certificate.validTo)}`,
		};
	}
	return { status: "operational" };
}

function formatDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function readPeerCertificate(url: URL): Promise<CertificateDeadline | null> {
	return new Promise((resolve) => {
		const socket = tls.connect({
			host: url.hostname,
			port: Number(url.port || 443),
			servername: url.hostname,
			// The HTTP check above already documents the chain; here we only
			// need `valid_to`, which an expired certificate would hide behind
			// a handshake error.
			rejectUnauthorized: false,
		});

		const finish = (certificate: CertificateDeadline | null) => {
			socket.destroy();
			resolve(certificate);
		};

		socket.setTimeout(CERTIFICATE_TIMEOUT_MS, () => finish(null));
		socket.once("error", () => finish(null));
		socket.once("secureConnect", () => {
			const { valid_to } = socket.getPeerCertificate();
			const validTo = valid_to ? new Date(valid_to) : null;
			finish(validTo && !Number.isNaN(validTo.getTime()) ? { validTo } : null);
		});
	});
}
