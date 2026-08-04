#!/usr/bin/env node
// Encodes a SUIT client certificate (.p12) into the single-line base64 value
// expected by EGAPRO_SUIT_CLIENT_CERT_P12_BASE64.
//
// Exists because the obvious one-liner is a trap: macOS `base64` wraps its
// output at 76 columns, and a wrapped value pasted into a .env file is silently
// truncated at the first newline. This always emits one line.
//
// Only encodes the bundle — the passphrase goes in
// EGAPRO_SUIT_CLIENT_CERT_PASSWORD by hand, so it never transits through here.
//
// Usage:
//   node scripts/encode-suit-cert.mjs <path/to/cert.p12>
//   node scripts/encode-suit-cert.mjs <path/to/cert.p12> --raw   # value only
//
// The certificate never leaves your machine — this only reads and re-encodes it.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const raw = args.includes("--raw");
const certPath = args.find((arg) => !arg.startsWith("--"));

if (!certPath) {
	console.error("Usage: node scripts/encode-suit-cert.mjs <cert.p12> [--raw]");
	process.exit(1);
}

let bundle;
try {
	bundle = readFileSync(certPath);
} catch (error) {
	console.error(`Cannot read ${certPath}: ${error.message}`);
	process.exit(1);
}

// A PKCS#12 bundle is a DER SEQUENCE, so it always starts with 0x30. Catching
// this here beats debugging an opaque TLS handshake failure later.
if (bundle[0] !== 0x30) {
	console.error(
		`${certPath} does not look like a PKCS#12 bundle (expected a DER SEQUENCE).\n` +
			"If you have a PEM certificate and key instead, convert them first:\n" +
			"  openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem",
	);
	process.exit(1);
}

const encoded = bundle.toString("base64");

if (raw) {
	process.stdout.write(`${encoded}\n`);
	process.exit(0);
}

console.log(`# ${bundle.length} bytes read from ${certPath}`);
console.log("# Paste into packages/app/.env.");
console.log(`EGAPRO_SUIT_CLIENT_CERT_P12_BASE64="${encoded}"`);
