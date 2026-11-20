import forge from "node-forge";
import type { SuitClient } from "suit-transport";

import { describeError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const CSE_TIMEOUT_MS = 10_000;
const GIP_METADATA_TIMEOUT_MS = 30_000;
const FILES_TIMEOUT_MS = 10_000;
const DAY_MS = 86_400_000;
/** Below a week, an expiring certificate is red, not orange. */
const CERTIFICATE_URGENT_DAYS = 7;

const CSE_PATH = (siren: string) => `/suit/api/externe/portail/CSE/${siren}`;
const GIP_METADATA_PATH = "/suit/api/externe/egapro/gipmds/latest/metadata";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
	dateStyle: "short",
	timeZone: "Europe/Paris",
});

/**
 * What an HTTP status says about the SUIT *transport*.
 *
 * Every status at all proves the mTLS handshake succeeded, so the probe's job
 * is only to separate the three cases that mean something else: a gateway or
 * upstream failure (`unavailable`), a refused certificate or key
 * (`misconfigured`), and everything else (`null` — the chain works).
 */
export function suitTransportStatus(status: number): ProbeStatus | null {
	if (status >= 500) return "unavailable";
	if (status === 401 || status === 403) return "misconfigured";
	return null;
}

export type SuitCseProbeOptions = {
	client: SuitClient;
	referenceSiren: string;
	/** A probe without a certificate cannot do mTLS: that is our misconfiguration. */
	certificateConfigured: boolean;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
};

/** Presence of a CSE record for a stable reference SIREN, over mTLS. */
export function createSuitCseProbe({
	client,
	referenceSiren,
	certificateConfigured,
	secrets,
	intervalSeconds = 60,
	timeoutMs = CSE_TIMEOUT_MS,
}: SuitCseProbeOptions): Probe {
	return {
		key: "suit-cse",
		label: "SUIT (présence CSE)",
		criticality: "important",
		kind: "partner",
		intervalSeconds,
		timeoutMs,
		async probe() {
			if (!certificateConfigured) {
				return {
					status: "misconfigured",
					latencyMs: 0,
					message: "certificat client SUIT absent",
				};
			}

			const elapsed = startTimer();
			try {
				const response = await client.fetchJson(CSE_PATH(referenceSiren));
				return cseResult(response.status, elapsed());
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(error, secrets, "connexion à SUIT impossible"),
				};
			}
		},
	};
}

function cseResult(
	status: number,
	latencyMs: number,
): { status: ProbeStatus; latencyMs: number; message?: string } {
	const outage = suitTransportStatus(status);
	if (outage === "misconfigured") {
		return {
			status: outage,
			latencyMs,
			message: `SUIT refuse le certificat client (HTTP ${status})`,
		};
	}
	if (outage) {
		return { status: outage, latencyMs, message: `SUIT répond ${status}` };
	}
	return status >= 300
		? { status: "operational", latencyMs, message: `SUIT répond ${status}` }
		: { status: "operational", latencyMs };
}

export type SuitGipMdsProbeOptions = {
	client: SuitClient;
	/** Base URL of the SUIT API, from the `suit` ConfigMap. */
	apiUrl: string;
	certificateConfigured: boolean;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
};

/**
 * The GIP-MDS metadata route, over mTLS.
 *
 * Deliberately sent without an `Accept` header: the WAF in front of SUIT
 * answers an HTML 403 (`x-waf-blocked: 1`) as soon as one is present on this
 * route. The import itself wants the CSV, so this probe only proves the chain
 * and the metadata endpoint.
 */
export function createSuitGipMdsProbe({
	client,
	apiUrl,
	certificateConfigured,
	secrets,
	intervalSeconds = 60,
	timeoutMs = GIP_METADATA_TIMEOUT_MS,
}: SuitGipMdsProbeOptions): Probe {
	return {
		key: "suit-gip-mds",
		label: "SUIT (fichier GIP-MDS)",
		criticality: "important",
		kind: "partner",
		intervalSeconds,
		timeoutMs,
		async probe() {
			if (!certificateConfigured) {
				return {
					status: "misconfigured",
					latencyMs: 0,
					message: "certificat client SUIT absent",
				};
			}

			const elapsed = startTimer();
			try {
				// Absolute URL through `fetchRaw`: the transport presents the
				// certificate only on the SUIT origin, and `init` carries no
				// `Accept` — the WAF answers an HTML 403 as soon as one is set.
				const response = await client.fetchRaw(
					new URL(GIP_METADATA_PATH, apiUrl).toString(),
					{ signal: AbortSignal.timeout(timeoutMs) },
				);
				const outage = suitTransportStatus(response.status);
				if (outage === "misconfigured") {
					return {
						status: outage,
						latencyMs: elapsed(),
						message: `SUIT refuse le certificat client (HTTP ${response.status})`,
					};
				}
				if (outage) {
					return {
						status: outage,
						latencyMs: elapsed(),
						message: `SUIT répond ${response.status}`,
					};
				}
				return {
					status: "operational",
					latencyMs: elapsed(),
					...(response.status >= 300
						? { message: `SUIT répond ${response.status}` }
						: {}),
				};
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(error, secrets, "connexion à SUIT impossible"),
				};
			}
		},
	};
}

export type SuitFilesProbeOptions = {
	gateway: { baseUrl: string; apiKey: string } | null;
	referenceSiren: string | null;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
	now?: () => Date;
};

/**
 * The file route SUIT consumes, end to end behind APISIX.
 *
 * A probe never deposits anything: a test CSE opinion would pollute a real
 * company's data. What is checked is the read side — the gateway key, the
 * WAF, the app route and a readable JSON answer — not a real deposit. The
 * absence of a write check is a documented limit, not an oversight.
 */
export function createSuitFilesProbe({
	gateway,
	referenceSiren,
	secrets,
	intervalSeconds = 60,
	timeoutMs = FILES_TIMEOUT_MS,
	fetchImpl = fetch,
	now = () => new Date(),
}: SuitFilesProbeOptions): Probe {
	return {
		key: "suit-cse-files",
		label: "SUIT (fichiers avis CSE)",
		criticality: "important",
		kind: "exposed",
		intervalSeconds,
		timeoutMs,
		async probe() {
			if (!gateway || !referenceSiren) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			try {
				const response = await fetchImpl(
					filesUrl(gateway.baseUrl, referenceSiren, now()),
					{
						headers: {
							Accept: "application/json",
							Authorization: `Bearer ${gateway.apiKey}`,
						},
						signal: AbortSignal.timeout(timeoutMs),
					},
				);

				const outage = suitTransportStatus(response.status);
				if (outage === "misconfigured") {
					return {
						status: outage,
						latencyMs: elapsed(),
						message: "clé du consumer de supervision refusée",
					};
				}
				if (outage) {
					return {
						status: outage,
						latencyMs: elapsed(),
						message: `l'API fichiers répond ${response.status}`,
					};
				}

				if (response.ok && !isJson(response)) {
					return {
						status: "degraded",
						latencyMs: elapsed(),
						message: "réponse non JSON",
					};
				}

				return {
					status: "operational",
					latencyMs: elapsed(),
					...(response.ok
						? {}
						: { message: `l'API fichiers répond ${response.status}` }),
				};
			} catch (error) {
				return {
					status: "unavailable",
					latencyMs: elapsed(),
					message: describeError(
						error,
						secrets,
						"connexion à l'API fichiers impossible",
					),
				};
			}
		},
	};
}

function filesUrl(baseUrl: string, siren: string, at: Date): URL {
	const url = new URL("/api/v1/files", baseUrl);
	url.searchParams.set("siren", siren);
	url.searchParams.set("year", String(at.getUTCFullYear()));
	return url;
}

function isJson(response: Response): boolean {
	return (response.headers.get("content-type") ?? "")
		.toLowerCase()
		.includes("application/json");
}

export type SuitCertificateProbeOptions = {
	p12Base64: string | null;
	passphrase: string | null;
	certWarnDays: number;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
	now?: () => Date;
	readCertificate?: (p12Base64: string, passphrase: string | null) => Date;
};

/**
 * Expiry of the mTLS client certificate.
 *
 * Neither Sentry nor the partner sees it coming: the certificate is only
 * presented on outgoing calls, and an expired one surfaces as a handshake
 * failure deep inside the app. Reading its `notAfter` is the only way to warn
 * before it happens.
 *
 * An unreadable bundle is `misconfigured`, never `unavailable`: SUIT is not
 * down, our packaging or passphrase is wrong. Nothing of the bundle or the
 * passphrase reaches the message.
 */
export function createSuitCertificateProbe({
	p12Base64,
	passphrase,
	certWarnDays,
	secrets,
	intervalSeconds = 60,
	timeoutMs = CSE_TIMEOUT_MS,
	now = () => new Date(),
	readCertificate = readClientCertificateNotAfter,
}: SuitCertificateProbeOptions): Probe {
	return {
		key: "suit-certificate",
		label: "SUIT (certificat client)",
		criticality: "critical",
		kind: "partner",
		intervalSeconds,
		timeoutMs,
		async probe() {
			if (!p12Base64) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			let notAfter: Date;
			try {
				notAfter = readCertificate(p12Base64, passphrase);
			} catch (error) {
				return {
					status: "misconfigured",
					latencyMs: elapsed(),
					message: describeError(error, secrets, "bundle PKCS#12 illisible"),
				};
			}

			return {
				...certificateResult(notAfter, now(), certWarnDays),
				latencyMs: elapsed(),
			};
		},
	};
}

export function certificateResult(
	notAfter: Date,
	at: Date,
	certWarnDays: number,
): { status: ProbeStatus; message?: string } {
	const remaining = notAfter.getTime() - at.getTime();
	const date = DATE_FORMAT.format(notAfter);

	if (remaining <= 0) {
		return {
			status: "unavailable",
			message: `certificat client SUIT expiré le ${date}`,
		};
	}

	const days = Math.ceil(remaining / DAY_MS);
	if (days <= CERTIFICATE_URGENT_DAYS) {
		return {
			status: "unavailable",
			message: `certificat client SUIT expire le ${date} (dans ${days} j)`,
		};
	}
	if (remaining <= certWarnDays * DAY_MS) {
		return {
			status: "degraded",
			message: `certificat client SUIT expire le ${date} (dans ${days} j)`,
		};
	}

	return { status: "operational" };
}

/**
 * `notAfter` of the first certificate in a PKCS#12 bundle.
 *
 * Node cannot unpack a PKCS#12 (`crypto` only accepts one to build a TLS
 * context), so `node-forge` does the ASN.1 reading — declared here and nowhere
 * else in the repository.
 */
export function readClientCertificateNotAfter(
	p12Base64: string,
	passphrase: string | null,
): Date {
	const der = forge.util.decode64(p12Base64.replace(/\s+/g, ""));
	const asn1 = forge.asn1.fromDer(der);
	const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, passphrase ?? "");
	const certBagOid = forge.pki.oids.certBag;
	if (!certBagOid) {
		throw new Error("certificate bag oid missing");
	}
	const bags = p12.getBags({ bagType: certBagOid })[certBagOid] ?? [];
	const certificate = bags.find((bag: forge.pkcs12.Bag) => bag.cert)?.cert;
	if (!certificate) {
		throw new Error("no certificate in bundle");
	}
	return certificate.validity.notAfter;
}
