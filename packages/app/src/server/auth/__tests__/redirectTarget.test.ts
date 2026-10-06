import { describe, expect, it } from "vitest";

import { resolveRedirectTarget } from "../redirectTarget";

const baseUrl = "https://egapro.example.fr";
const home = `${baseUrl}/mon-espace`;

describe("resolveRedirectTarget", () => {
	it.each([
		["https://egapro.example.fr.exemple-malveillant.tld/"],
		["https://egapro.example.fr@exemple-malveillant.tld/"],
		["//exemple-malveillant.tld"],
		["/\\exemple-malveillant.tld"],
		["https://exemple-malveillant.tld/steal"],
		["http://egapro.example.fr/page"],
		["javascript:alert(1)"],
		["not a url"],
		[""],
	])("falls back to the home page for %s", (url) => {
		expect(resolveRedirectTarget(url, baseUrl)).toBe(home);
	});

	it.each([
		[baseUrl],
		[`${baseUrl}/`],
		["/"],
	])("sends the site root %s to the home page", (url) => {
		expect(resolveRedirectTarget(url, baseUrl)).toBe(home);
	});

	it("prefixes a legitimate relative path with baseUrl", () => {
		expect(resolveRedirectTarget("/dashboard?a=1", baseUrl)).toBe(
			`${baseUrl}/dashboard?a=1`,
		);
	});

	it("keeps an absolute url of the exact same origin", () => {
		const url = `${baseUrl}/dashboard`;
		expect(resolveRedirectTarget(url, baseUrl)).toBe(url);
	});
});
