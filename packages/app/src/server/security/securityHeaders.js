const PERMISSIONS_POLICY = [
	"accelerometer",
	"browsing-topics",
	"camera",
	"display-capture",
	"geolocation",
	"gyroscope",
	"magnetometer",
	"microphone",
	"payment",
	"usb",
]
	.map((feature) => `${feature}=()`)
	.join(", ");

export const NONCE_HEADER = "x-nonce";

const NONCE_BYTES = 16;
const NONCE_SHAPE = /^[A-Za-z0-9+/]{22}==$/;

export function generateNonce() {
	const bytes = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
	return btoa(String.fromCharCode(...bytes));
}

/**
 * @param {string | null | undefined} value
 * @returns {value is string}
 */
export function isNonce(value) {
	return typeof value === "string" && NONCE_SHAPE.test(value);
}

const CSP_REPORT_GROUP = "csp-endpoint";

/**
 * @typedef {{
 *   isDevelopment: boolean,
 *   nonce: string,
 *   matomoUrl?: string,
 *   sentryDsn?: string,
 * }} ContentSecurityPolicyOptions
 */

/** @param {string | undefined} url */
function originOf(url) {
	if (!url) return undefined;
	try {
		return new URL(url).origin;
	} catch {
		return undefined;
	}
}

/**
 * Mirrors the DSN grammar of the Sentry SDK: `<protocol>://<publicKey>@<host>[/<path>]/<projectId>`.
 *
 * @param {string | undefined} dsn
 * @returns {{ origin: string, securityReportUrl: string } | undefined}
 */
export function sentryEndpointsOf(dsn) {
	if (!dsn) return undefined;
	let url;
	try {
		url = new URL(dsn);
	} catch {
		return undefined;
	}
	const segments = url.pathname.split("/").filter(Boolean);
	const projectId = segments.pop();
	if (
		!["http:", "https:"].includes(url.protocol) ||
		!/^\w+$/.test(url.username) ||
		!projectId ||
		!/^\d+$/.test(projectId) ||
		// The URL lands in a header value, where `;` and `,` would split it.
		!segments.every((segment) => /^[\w.~%-]+$/.test(segment))
	) {
		return undefined;
	}
	const base = [url.origin, ...segments].join("/");
	return {
		origin: url.origin,
		securityReportUrl: `${base}/api/${projectId}/security/?sentry_key=${url.username}`,
	};
}

/** @param {ContentSecurityPolicyOptions} options */
export function buildContentSecurityPolicy({
	isDevelopment,
	nonce,
	matomoUrl,
	sentryDsn,
}) {
	const matomo = originOf(matomoUrl);
	const matomoSources = matomo ? [matomo] : [];
	const sentry = sentryEndpointsOf(sentryDsn);

	/** @type {Record<string, string[]>} */
	const directives = {
		"default-src": ["'self'"],
		// 'strict-dynamic' trusts what the nonced Next.js runtime loads (chunks, Matomo tracker);
		// browsers that honour it ignore 'self' and the Matomo origin, kept for CSP Level 2.
		// React relies on eval for its development-only error overlays.
		"script-src": [
			"'self'",
			`'nonce-${nonce}'`,
			"'strict-dynamic'",
			...(isDevelopment ? ["'unsafe-eval'"] : []),
			...matomoSources,
		],
		// next/image writes a `style` attribute, which no nonce can allow — and a nonce
		// in this directive would switch 'unsafe-inline' off.
		"style-src": ["'self'", "'unsafe-inline'"],
		"img-src": ["'self'", "data:", "blob:", ...matomoSources],
		"font-src": ["'self'", "data:"],
		// @sentry/nextjs only tunnels SaaS DSNs through `tunnelRoute`: a self-hosted
		// instance is reached directly at the DSN host.
		"connect-src": [
			"'self'",
			...matomoSources,
			...(sentry ? [sentry.origin] : []),
		],
		"frame-src": matomo ? [matomo] : ["'none'"],
		"worker-src": ["'self'", "blob:"],
		"object-src": ["'none'"],
		"base-uri": ["'self'"],
		// ProConnect is reached by script navigation and redirects, never by a form post.
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
		...(sentry
			? {
					"report-uri": [sentry.securityReportUrl],
					"report-to": [CSP_REPORT_GROUP],
				}
			: {}),
	};

	return Object.entries(directives)
		.map(([name, sources]) => [name, ...sources].join(" "))
		.join("; ");
}

/**
 * @param {ContentSecurityPolicyOptions} options
 * @returns {{ "Content-Security-Policy": string, "Reporting-Endpoints"?: string }}
 */
export function buildContentSecurityPolicyHeaders(options) {
	const sentry = sentryEndpointsOf(options.sentryDsn);
	return {
		"Content-Security-Policy": buildContentSecurityPolicy(options),
		...(sentry
			? {
					"Reporting-Endpoints": `${CSP_REPORT_GROUP}="${sentry.securityReportUrl}"`,
				}
			: {}),
	};
}

export function buildSecurityHeaders() {
	return [
		{
			source: "/(.*)",
			headers: [
				{ key: "X-Frame-Options", value: "DENY" },
				{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				{ key: "Permissions-Policy", value: PERMISSIONS_POLICY },
				{ key: "X-Content-Type-Options", value: "nosniff" },
			],
		},
	];
}
