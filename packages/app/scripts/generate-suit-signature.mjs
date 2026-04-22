#!/usr/bin/env node
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

// All SUIT-protected routes (cf. src/app/api/v1/**). Keep in sync when a route
// adds or removes `verifySuitAuth`. Dynamic segments (e.g. [fileId]) are
// signed only if a concrete value is passed (--file-id), since the signature
// must match the exact pathname of the actual request.
const SUIT_ROUTES = [
	{ method: "GET", path: "/api/v1/export/declarations" },
	{ method: "GET", path: "/api/v1/files" },
];

const { values } = parseArgs({
	options: {
		"key-file": { type: "string" },
		"file-id": { type: "string" },
		method: { type: "string" },
		path: { type: "string" },
		url: { type: "string", default: "http://localhost:3000" },
		help: { type: "boolean", short: "h", default: false },
	},
});

if (values.help) {
	printHelp();
	process.exit(0);
}

const privateKey = createPrivateKey(loadPrivateKey());
const baseUrl = values.url.replace(/\/$/, "");
const timestamp = Math.floor(Date.now() / 1000);

const routes = resolveRoutes();

for (const [index, route] of routes.entries()) {
	if (index > 0) console.log("\n---\n");
	printRoute(route);
}

/** @returns {Array<{method: string, path: string}>} */
function resolveRoutes() {
	if (values.path) {
		return [
			{ method: (values.method ?? "GET").toUpperCase(), path: values.path },
		];
	}
	const routes = [...SUIT_ROUTES];
	if (values["file-id"]) {
		routes.push({ method: "GET", path: `/api/v1/files/${values["file-id"]}` });
	}
	return routes;
}

/** @param {{method: string, path: string}} route */
function printRoute(route) {
	const payload = `${timestamp}|${route.method}|${route.path}`;
	const signature = sign(
		"RSA-SHA256",
		Buffer.from(payload),
		privateKey,
	).toString("base64");

	console.log(`${route.method} ${route.path}`);
	console.log(`  X-Timestamp: ${timestamp}`);
	console.log(`  X-Signature: ${signature}`);
	console.log();
	console.log(
		[
			`  curl -X ${route.method} \\`,
			`    -H 'X-Timestamp: ${timestamp}' \\`,
			`    -H 'X-Signature: ${signature}' \\`,
			`    -H 'Authorization: Bearer '"$EGAPRO_SUIT_API_KEY"'' \\`,
			`    '${baseUrl}${route.path}'`,
		].join("\n"),
	);
}

/** @returns {string} */
function loadPrivateKey() {
	if (values["key-file"]) {
		try {
			return readFileSync(values["key-file"], "utf-8");
		} catch (err) {
			return fail(
				`Impossible de lire --key-file "${values["key-file"]}" : ${errorMessage(err)}`,
			);
		}
	}

	const envKey = process.env.SUIT_PRIVATE_KEY_PEM;
	if (envKey) {
		if (envKey.includes("-----BEGIN")) return envKey;
		try {
			return Buffer.from(envKey, "base64").toString("utf-8");
		} catch (err) {
			return fail(`SUIT_PRIVATE_KEY_PEM invalide : ${errorMessage(err)}`);
		}
	}

	return fail(
		"Clé privée manquante. Passez --key-file <chemin> ou SUIT_PRIVATE_KEY_PEM (PEM ou base64).",
	);
}

/**
 * @param {unknown} err
 * @returns {string}
 */
function errorMessage(err) {
	return err instanceof Error ? err.message : String(err);
}

function printHelp() {
	console.log(`Génère les signatures SUIT (X-Timestamp + X-Signature) pour toutes les routes protégées.

Par défaut, signe l'ensemble des routes SUIT connues en une seule exécution.
Passer --path pour signer une route unique (custom).

Usage :
  node scripts/generate-suit-signature.mjs [options]

Options :
  --key-file <path>   Chemin vers la clé privée PEM
                      (ou variable d'env SUIT_PRIVATE_KEY_PEM, PEM brut ou base64)
  --file-id <uuid>    Inclut aussi /api/v1/files/<uuid> dans la sortie
  --path <pathname>   Signer uniquement cette route (désactive le mode "toutes les routes")
  --method <verb>     Méthode HTTP pour --path (défaut : GET)
  --url <base>        URL de base pour le curl (défaut : http://localhost:3000)
  -h, --help          Affiche cette aide

Validité de la signature :
  - dev                 : 30 jours
  - preprod / prod      : 30 secondes (à utiliser immédiatement)
`);
}

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
	console.error(`Erreur : ${message}`);
	console.error("Lancez avec --help pour voir l'usage.");
	process.exit(1);
}
