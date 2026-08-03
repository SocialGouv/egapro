#!/usr/bin/env node
// Checks that the mTLS connection to SUIT works, without touching the app.
//
// Answers one question: is a SUIT failure caused by our certificate, or by the
// endpoint itself? A response — any status, even 404 — proves the handshake
// succeeded, so the certificate is fine. A thrown error means it is not.
//
// Usage:
//   pnpm --filter app suit:check              # reads the ambient env
//   node --env-file=.env scripts/check-suit-connection.mjs   # local, from .env
//   kubectl exec deploy/app -- node scripts/check-suit-connection.mjs
//
// Prints statuses only — never the certificate, the passphrase, or response
// bodies, which may carry SIREN-level data.
import { Agent } from "undici";

const baseUrl = (process.env.EGAPRO_SUIT_API_URL ?? "").replace(/\/$/, "");
const p12 = process.env.EGAPRO_SUIT_CLIENT_CERT_P12_BASE64;
const passphrase = process.env.EGAPRO_SUIT_CLIENT_CERT_PASSWORD;

if (!baseUrl) {
	console.error("EGAPRO_SUIT_API_URL is not set — nothing to check.");
	process.exit(1);
}

console.log(`SUIT           : ${baseUrl}`);
console.log(
	`Certificat     : ${p12 ? `${p12.length} caractères base64` : "ABSENT"}`,
);
console.log(
	`Mot de passe   : ${passphrase ? `${passphrase.length} caractères` : "absent"}`,
);

if (!p12) {
	console.error(
		"\nAucun certificat configuré : les appels partiraient sans mTLS et SUIT les refuserait.",
	);
	process.exit(1);
}

const dispatcher = new Agent({
	connect: { pfx: Buffer.from(p12, "base64"), passphrase },
});

// The GIP metadata route is the cheapest open endpoint: a small JSON payload,
// no side effect, and it is the one SUIT opened first.
const target = `${baseUrl}/suit/api/externe/egapro/gipmds/latest/metadata`;

let exitCode = 0;
try {
	const response = await fetch(target, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(30_000),
		redirect: "error",
		dispatcher,
	});
	console.log(
		`\nGET metadata   : HTTP ${response.status} ${response.statusText}`,
	);
	if (response.ok) {
		console.log("→ Connexion mTLS OK : le certificat est accepté par SUIT.");
	} else {
		console.log(
			"→ Le certificat est accepté (la poignée de main a réussi) ; c'est l'endpoint qui répond en erreur.",
		);
	}
} catch (error) {
	const cause = error.cause ?? error;
	console.error(
		`\nGET metadata   : ÉCHEC ${cause.code ?? ""} ${cause.message}`,
	);
	console.error(
		"→ Aucune réponse : certificat refusé, expiré, mot de passe erroné, ou SUIT injoignable.",
	);
	exitCode = 1;
}

await dispatcher.close();
process.exit(exitCode);
