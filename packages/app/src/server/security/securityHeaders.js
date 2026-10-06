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

export const FILE_ROUTES_WITHOUT_CSP = [
	"/api/declaration-pdf",
	"/api/representation-pdf",
	"/api/transmitted-pdf",
	"/api/prefill-pdf",
	"/api/v1/files",
];

const EVERY_PATH = "/(.*)";

// Chrome's built-in PDF viewer refuses to render a document served under a CSP.
const EVERY_PATH_EXCEPT_FILE_ROUTES = `/((?!(?:${FILE_ROUTES_WITHOUT_CSP.map(
	(route) => route.slice(1),
).join("|")})(?:/|$)).*)`;

/**
 * @typedef {{ isDevelopment: boolean, matomoUrl?: string }} SecurityHeadersOptions
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

/** @param {SecurityHeadersOptions} options */
export function buildContentSecurityPolicy({ isDevelopment, matomoUrl }) {
	const matomo = originOf(matomoUrl);
	const matomoSources = matomo ? [matomo] : [];

	/** @type {Record<string, string[]>} */
	const directives = {
		"default-src": ["'self'"],
		// React relies on eval for its development-only error overlays.
		"script-src": [
			"'self'",
			"'unsafe-inline'",
			...(isDevelopment ? ["'unsafe-eval'"] : []),
			...matomoSources,
		],
		"style-src": ["'self'", "'unsafe-inline'"],
		"img-src": ["'self'", "data:", "blob:", ...matomoSources],
		"font-src": ["'self'", "data:"],
		// Sentry is reached through the same-origin tunnel route, not its DSN host.
		"connect-src": ["'self'", ...matomoSources],
		"frame-src": matomo ? [matomo] : ["'none'"],
		"worker-src": ["'self'", "blob:"],
		"object-src": ["'none'"],
		"base-uri": ["'self'"],
		// ProConnect is reached by script navigation and redirects, never by a form post.
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
	};

	return Object.entries(directives)
		.map(([name, sources]) => [name, ...sources].join(" "))
		.join("; ");
}

/** @param {SecurityHeadersOptions} options */
export function buildSecurityHeaders(options) {
	return [
		{
			source: EVERY_PATH,
			headers: [
				{ key: "X-Frame-Options", value: "DENY" },
				{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				{ key: "Permissions-Policy", value: PERMISSIONS_POLICY },
				{ key: "X-Content-Type-Options", value: "nosniff" },
			],
		},
		{
			source: EVERY_PATH_EXCEPT_FILE_ROUTES,
			headers: [
				{
					key: "Content-Security-Policy",
					value: buildContentSecurityPolicy(options),
				},
			],
		},
	];
}
