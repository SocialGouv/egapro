#!/usr/bin/env node
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({
	options: {
		"key-file": { type: "string" },
		method: { type: "string", default: "GET" },
		path: { type: "string", default: "/api/v1/export/declarations" },
		url: { type: "string", default: "http://localhost:3000" },
		help: { type: "boolean", short: "h", default: false },
	},
});

if (values.help) {
	printHelp();
	process.exit(0);
}

const privateKeyPem = loadPrivateKey();
const method = values.method.toUpperCase();
const pathname = values.path;
const baseUrl = values.url.replace(/\/$/, "");
const timestamp = Math.floor(Date.now() / 1000);
const payload = `${timestamp}|${method}|${pathname}`;

const signature = sign(
	"RSA-SHA256",
	Buffer.from(payload),
	createPrivateKey(privateKeyPem),
).toString("base64");

console.log("Payload signé :");
console.log(`  ${payload}`);
console.log();
console.log("Headers :");
console.log(`  X-Timestamp: ${timestamp}`);
console.log(`  X-Signature: ${signature}`);
console.log();
console.log("Exemple curl :");
console.log(
	[
		`curl -X ${method} \\`,
		`  -H 'X-Timestamp: ${timestamp}' \\`,
		`  -H 'X-Signature: ${signature}' \\`,
		`  -H 'Authorization: Bearer '"$EGAPRO_SUIT_API_KEY"'' \\`,
		`  '${baseUrl}${pathname}'`,
	].join("\n"),
);

/** @returns {string} */
function loadPrivateKey() {
	if (values["key-file"]) {
		try {
			return readFileSync(values["key-file"], "utf-8");
		} catch (err) {
			fail(
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
			fail(`SUIT_PRIVATE_KEY_PEM invalide : ${errorMessage(err)}`);
		}
	}

	fail(
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
	console.log(`Génère une signature SUIT (X-Timestamp + X-Signature) pour tester l'API.

Usage :
  node scripts/generate-suit-signature.js [options]

Options :
  --key-file <path>   Chemin vers la clé privée PEM
                      (ou variable d'env SUIT_PRIVATE_KEY_PEM, PEM brut ou base64)
  --method <verb>     Méthode HTTP (défaut : GET)
  --path <pathname>   Chemin de la route (défaut : /api/v1/export/declarations)
  --url <base>        URL de base pour le curl d'exemple (défaut : http://localhost:3000)
  -h, --help          Affiche cette aide

Exemples :
  node scripts/generate-suit-signature.js --key-file ./suit-signing.key
  node scripts/generate-suit-signature.js --path '/api/v1/files' --method GET
  SUIT_PRIVATE_KEY_PEM=$(cat ./suit-signing.key | base64) \\
    node scripts/generate-suit-signature.js

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
