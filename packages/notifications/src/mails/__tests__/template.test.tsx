import { describe, expect, it } from "vitest";

import { formatFrenchDate, formatSiren } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getMySpaceUrl, getPublicUrl } from "../shared/urls.js";
import { EmailCtaWithLink } from "../template/EmailCtaWithLink.js";
import { EmailGreeting } from "../template/EmailGreeting.js";
import { EmailInfoList } from "../template/EmailInfoList.js";
import { EmailParagraph } from "../template/EmailParagraph.js";
import { EmailShell } from "../template/EmailShell.js";

describe("EmailShell", () => {
	it("renders the DSFR header, illustration band and footer", async () => {
		const { html, text } = await renderEmail(
			<EmailShell previewText="Sample">
				<EmailGreeting>Bonjour</EmailGreeting>
				<EmailParagraph>Body</EmailParagraph>
			</EmailShell>,
		);
		// RF Marianne emblem + bloc-marque text (ministry + devise + direction)
		expect(html).toContain("republique-francaise@2x.png");
		expect(html).toContain("République française");
		expect(html).toContain("Ministère");
		expect(html).toContain("et des solidarités");
		expect(html).toContain("Liberté");
		expect(html).toContain("Fraternité");
		expect(html).toContain("Direction Générale");
		expect(html).toContain("du Travail");
		// Illustration band: title + egapro icon
		expect(html).toContain("Egapro");
		expect(html).toContain("icon@2x.png");
		expect(html).toContain("femmes-hommes");
		expect(html).toContain("Indicateurs d&#x27;égalité professionnelle femmes");
		// Footer keeps the egapro legal notice + data-policy link
		expect(html).toContain("envoyé automatiquement");
		expect(html).toContain("/web/donnees-personnelles");
		expect(html).toContain(getPublicUrl());
		// Référent mail is a DSFR underlined mailto link (example address)
		expect(html).toContain("referent-egalite@dreets.gouv.fr");
		// Body
		expect(html).toContain("Bonjour");
		expect(html).toContain("Body");
		expect(text).toContain("Bonjour");
	});

	it("opts out of dark mode (light-only stylesheet)", async () => {
		const { html } = await renderEmail(
			<EmailShell previewText="t">
				<EmailParagraph>x</EmailParagraph>
			</EmailShell>,
		);
		expect(html).toContain("color-scheme: light");
		expect(html).not.toContain("prefers-color-scheme: dark");
		expect(html).not.toContain("darkmode");
	});

	it("uses the DSFR blue France primary color", async () => {
		const { html } = await renderEmail(
			<EmailShell previewText="t">
				<EmailParagraph>x</EmailParagraph>
			</EmailShell>,
		);
		expect(html).toContain("#000091");
	});
});

describe("EmailInfoList", () => {
	it("renders label/value pairs with formatted SIREN", async () => {
		const { html } = await renderEmail(
			<EmailShell previewText="t">
				<EmailInfoList
					rows={[
						{ label: "SIREN", value: formatSiren("552100554") },
						{ label: "Année", value: 2027 },
					]}
				/>
			</EmailShell>,
		);
		expect(html).toContain("SIREN");
		expect(html).toContain("552 100 554");
		expect(html).toContain("Année");
		expect(html).toContain("2027");
	});
});

describe("EmailCtaWithLink", () => {
	it("renders a DSFR button plus a fallback link to the same destination", async () => {
		const href = "https://test.example/mon-espace";
		const { html } = await renderEmail(
			<EmailShell previewText="t">
				<EmailCtaWithLink href={href} label="Commencer ma déclaration" />
			</EmailShell>,
		);
		// The label is shown on the button (and as the fallback link text)
		expect(html).toContain("Commencer ma déclaration");
		// The href backs both the button and the fallback link
		const occurrences = html.split(href).length - 1;
		expect(occurrences).toBeGreaterThanOrEqual(2);
		// The DSFR primary-button border construct
		expect(html).toContain("solid 1px #000091");
	});
});

describe("formatSiren", () => {
	it("applies 3-3-3 grouping", () => {
		expect(formatSiren("552100554")).toBe("552 100 554");
	});

	it("handles null/undefined gracefully", () => {
		expect(formatSiren(null)).toBe("");
		expect(formatSiren(undefined)).toBe("");
	});
});

describe("formatFrenchDate", () => {
	it("renders ordinal for day 1", () => {
		expect(formatFrenchDate("2027-06-01T00:00:00.000Z")).toContain("1ᵉʳ juin");
	});

	it("renders a regular day", () => {
		const formatted = formatFrenchDate("2027-06-15T12:00:00.000Z");
		expect(formatted).toContain("15 juin");
		expect(formatted).toContain("2027");
	});

	it("returns empty string for null/undefined/invalid", () => {
		expect(formatFrenchDate(null)).toBe("");
		expect(formatFrenchDate(undefined)).toBe("");
		expect(formatFrenchDate("not-a-date")).toBe("");
	});
});

describe("URL helpers", () => {
	it("getMySpaceUrl trims trailing slash and appends path", () => {
		const previous = process.env.EGAPRO_PUBLIC_URL;
		process.env.EGAPRO_PUBLIC_URL = "https://test.example/";
		try {
			expect(getMySpaceUrl()).toBe("https://test.example/mon-espace");
		} finally {
			if (previous === undefined) {
				delete process.env.EGAPRO_PUBLIC_URL;
			} else {
				process.env.EGAPRO_PUBLIC_URL = previous;
			}
		}
	});
});
