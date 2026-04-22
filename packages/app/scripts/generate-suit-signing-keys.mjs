#!/usr/bin/env node
// Generate or renew an RSA key pair for SUIT API request signing.
//
// SUIT signs each request with the private key. EgaPro verifies
// the signature with the public key (stored as EGAPRO_SUIT_PUBLIC_KEY_PEM).
//
// Usage:
//   node packages/app/scripts/generate-suit-signing-keys.mjs <command> <env> [--output-dir <path>]
//
//   command: generate | renew
//   env:     dev | prod | all
//
// Commands:
//   generate  Create a new key pair. Refuses to overwrite existing keys.
//   renew     Back up the current key pair (timestamped), then generate new keys.
//
// Examples:
//   node packages/app/scripts/generate-suit-signing-keys.mjs generate dev
//   node packages/app/scripts/generate-suit-signing-keys.mjs generate all
//   node packages/app/scripts/generate-suit-signing-keys.mjs renew prod
//   node packages/app/scripts/generate-suit-signing-keys.mjs generate dev --output-dir ./my-keys
//
// Output files (per env):
//   suit-signing.key — RSA private key (give to SUIT — they sign requests with it)
//   suit-signing.pub — RSA public key  (base64 → K8s secret EGAPRO_SUIT_PUBLIC_KEY_PEM)

import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const KEY_SIZE = 4096;
const SCRIPT = "node packages/app/scripts/generate-suit-signing-keys.mjs";

/** @typedef {"dev" | "prod"} EnvName */

/** @type {Record<EnvName, string>} */
const ENV_HOSTS = {
	dev: "egapro-dev.ovh.fabrique.social.gouv.fr",
	prod: "egapro.travail.gouv.fr",
};
/** @type {readonly EnvName[]} */
const VALID_ENVS = ["dev", "prod"];

/** @param {string} v @returns {v is EnvName} */
function isValidEnv(v) {
	return VALID_ENVS.includes(/** @type {EnvName} */ (v));
}

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		"output-dir": { type: "string", default: "./suit-signing-keys" },
		help: { type: "boolean", short: "h", default: false },
	},
});

if (values.help) {
	printUsage();
	process.exit(0);
}

const command = positionals[0];
const envArg = positionals[1];

if (!command || !envArg) {
	printUsage();
	process.exit(1);
}

if (command !== "generate" && command !== "renew") {
	fail(`Unknown command '${command}'. Must be 'generate' or 'renew'.`);
}

/** @type {readonly EnvName[] | null} */
const envs =
	envArg === "all" ? VALID_ENVS : isValidEnv(envArg) ? [envArg] : null;

if (!envs) {
	fail(
		`Unknown environment '${envArg}'. Must be one of: ${[...VALID_ENVS, "all"].join(", ")}.`,
	);
}

const outputDir = values["output-dir"] ?? "./suit-signing-keys";
for (const envName of envs) {
	generateKeys(envName, outputDir, command);
}

/**
 * @param {EnvName} envName
 * @param {string} baseDir
 * @param {"generate" | "renew"} command
 */
function generateKeys(envName, baseDir, command) {
	const outputDir = join(baseDir, envName);
	const privatePath = join(outputDir, "suit-signing.key");
	const publicPath = join(outputDir, "suit-signing.pub");
	const host = ENV_HOSTS[envName];

	mkdirSync(outputDir, { recursive: true });

	if (existsSync(privatePath)) {
		if (command === "generate") {
			console.error(`Error: keys already exist in ${outputDir}/`);
			console.error(
				`  Use '${SCRIPT} renew ${envName}' to rotate keys (will back up the current pair).`,
			);
			process.exit(1);
		}
		console.log(`=== [${envName}] Backing up existing keys ===`);
		backupKeys(outputDir, privatePath, publicPath);
	}

	console.log(`=== [${envName}] Generating RSA-${KEY_SIZE} key pair ===`);
	const { privateKey, publicKey } = generateKeyPairSync("rsa", {
		modulusLength: KEY_SIZE,
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs1", format: "pem" },
	});

	writeFileSync(privatePath, privateKey, { mode: 0o600 });
	writeFileSync(publicPath, publicKey);

	const pubBase64 = Buffer.from(publicKey).toString("base64");

	console.log("");
	console.log(`=== [${envName}] Done ===`);
	console.log("");
	console.log(`Files generated in ${outputDir}/:`);
	console.log(
		"  suit-signing.key — Private key -> give to SUIT (they sign requests)",
	);
	console.log("  suit-signing.pub — Public key");
	console.log("");
	console.log(`=== [${envName}] Next steps ===`);
	console.log("");

	if (command === "renew") {
		console.log("  ROTATION PROCEDURE (both sides must switch together):");
		console.log("");
		console.log(
			`  1. Update the K8s sealed-secret for ${envName} with the new public key.`,
		);
		console.log(
			"     Value for EGAPRO_SUIT_PUBLIC_KEY_PEM (base64 of suit-signing.pub):",
		);
		console.log("");
		console.log(`     ${pubBase64}`);
		console.log("");
		console.log("  2. Deploy EgaPro with the updated secret.");
		console.log("");
		console.log("  3. Give SUIT the new private key (suit-signing.key).");
		console.log(
			"     They must switch to it immediately after EgaPro is deployed.",
		);
		console.log("");
		console.log(
			"  The old keys are in the backup directory if you need to rollback.",
		);
	} else {
		console.log(
			`  1. Add the public key to the K8s sealed-secret for ${envName}.`,
		);
		console.log(
			"     Value for EGAPRO_SUIT_PUBLIC_KEY_PEM (base64 of suit-signing.pub):",
		);
		console.log("");
		console.log(`     ${pubBase64}`);
		console.log("");
		console.log("  2. Give SUIT the private key (suit-signing.key).");
		console.log("     They must keep it secure — it proves their identity.");
	}

	console.log("");
	console.log("  SUIT signs each request:");
	console.log("   TIMESTAMP=$(date +%s)");
	console.log('   PAYLOAD="$TIMESTAMP|GET|/api/v1/export/declarations"');
	console.log(
		'   SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -sign suit-signing.key | openssl base64 -A)',
	);
	console.log('   curl -H "X-Timestamp: $TIMESTAMP" \\');
	console.log('        -H "X-Signature: $SIGNATURE" \\');
	console.log("        -H 'Authorization: Bearer <api-key>' \\");
	console.log(
		`        https://${host}/api/v1/export/declarations?date_begin=2026-01-01`,
	);
	console.log("");
}

/**
 * @param {string} outputDir
 * @param {string} privatePath
 * @param {string} publicPath
 */
function backupKeys(outputDir, privatePath, publicPath) {
	const now = new Date();
	const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");
	const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
	const backupDir = join(outputDir, `backup-${stamp}`);

	mkdirSync(backupDir, { recursive: true });
	renameSync(privatePath, join(backupDir, "suit-signing.key"));
	renameSync(publicPath, join(backupDir, "suit-signing.pub"));

	console.log(`  Existing keys backed up to ${backupDir}/`);
}

function printUsage() {
	console.log(`Usage: ${SCRIPT} <command> <env> [--output-dir <path>]

  command: generate | renew
  env:     dev | prod | all

Commands:
  generate  Create a new key pair (refuses if keys already exist)
  renew     Back up existing keys, then generate new ones

Examples:
  ${SCRIPT} generate dev                        # first-time setup for dev
  ${SCRIPT} generate all                        # first-time setup for both environments
  ${SCRIPT} renew prod                          # rotate prod keys (backs up current pair)
  ${SCRIPT} generate dev --output-dir ./my-keys # custom output directory`);
}

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
	console.error(`Error: ${message}`);
	console.error("");
	printUsage();
	process.exit(1);
}
