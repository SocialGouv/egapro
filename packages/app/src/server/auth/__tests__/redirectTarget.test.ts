import { describe, expect, it } from "vitest";

import { resolveRedirectTarget } from "../redirectTarget";

const baseUrl = "https://egapro.example.fr";
const home = `${baseUrl}/mon-espace`;

describe("resolveRedirectTarget", () => {
	it.each([
		["a foreign absolute url", "https://exemple-malveillant.tld/steal"],
		[
			"our host as a prefix of a foreign one",
			"https://egapro.example.fr.evil/",
		],
		["our host as userinfo", "https://egapro.example.fr@evil/"],
		["a protocol-relative path", "//evil"],
		["a slash then a backslash", "/\\evil"],
		["two backslashes", "\\\\evil"],
		["a tab hidden in a protocol-relative path", "/\t/evil.com"],
		["a leading space before a protocol-relative path", " //evil.com"],
		["a percent-encoded foreign host", "https://%65vil.com/x"],
		["javascript:", "javascript:alert(1)"],
		["data:", "data:text/html,<script>alert(1)</script>"],
		["a blob: url carrying our own origin", `blob:${baseUrl}/x`],
		["our host over http", "http://egapro.example.fr/page"],
		["our host with a trailing dot", "https://egapro.example.fr./dashboard"],
		["our host on another port", "https://egapro.example.fr:8443/dashboard"],
		[
			"credentials in front of our own host",
			`https://user:pass@egapro.example.fr/x`,
		],
		["a username in front of our own host", `https://user@egapro.example.fr/x`],
	])("falls back to the home page for %s", (_label, url) => {
		expect(resolveRedirectTarget(url, baseUrl)).toBe(home);
	});

	it.each([
		["the origin", baseUrl],
		["the origin with a trailing slash", `${baseUrl}/`],
		["the relative root", "/"],
		["an empty string", ""],
	])("sends %s to the home page", (_label, url) => {
		expect(resolveRedirectTarget(url, baseUrl)).toBe(home);
	});

	it.each([
		["a relative path", "/dashboard?a=1", `${baseUrl}/dashboard?a=1`],
		[
			"an absolute url of the exact origin",
			`${baseUrl}/dashboard`,
			`${baseUrl}/dashboard`,
		],
		[
			"CRLF and a tab inside the path",
			`${baseUrl}/da\tsh\r\nboard`,
			`${baseUrl}/dashboard`,
		],
		["CRLF inside a relative path", "/da\r\nshboard", `${baseUrl}/dashboard`],
		["a leading space", " /dashboard", `${baseUrl}/dashboard`],
		["a leading tab", "\t/dashboard", `${baseUrl}/dashboard`],
		[
			"an uppercase scheme and host",
			"HTTPS://EGAPRO.EXAMPLE.FR/Dashboard",
			`${baseUrl}/Dashboard`,
		],
		[
			"a percent-encoded copy of our host",
			"https://egapro%2Eexample%2Efr/x",
			`${baseUrl}/x`,
		],
		["the default port", "https://egapro.example.fr:443/x", `${baseUrl}/x`],
		[
			"a percent-encoded protocol-relative path",
			"/%2F%2Fevil.com",
			`${baseUrl}/%2F%2Fevil.com`,
		],
		["a path-relative reference", "not a url", `${baseUrl}/not%20a%20url`],
	])("keeps %s on our origin, normalized", (_label, url, expected) => {
		expect(resolveRedirectTarget(url, baseUrl)).toBe(expected);
	});
});

describe("resolveRedirectTarget on a plain-http origin", () => {
	const localBaseUrl = "http://localhost:3000";

	it.each([
		["a relative path", "/dashboard", `${localBaseUrl}/dashboard`],
		[
			"an absolute url of the exact origin",
			`${localBaseUrl}/dashboard`,
			`${localBaseUrl}/dashboard`,
		],
		["the origin", localBaseUrl, `${localBaseUrl}/mon-espace`],
		[
			"the origin with a trailing slash",
			`${localBaseUrl}/`,
			`${localBaseUrl}/mon-espace`,
		],
		["the relative root", "/", `${localBaseUrl}/mon-espace`],
		["a foreign url", "https://evil.com/steal", `${localBaseUrl}/mon-espace`],
		[
			"the https twin of our origin",
			"https://localhost:3000/dashboard",
			`${localBaseUrl}/mon-espace`,
		],
	])("resolves %s", (_label, url, expected) => {
		expect(resolveRedirectTarget(url, localBaseUrl)).toBe(expected);
	});
});
