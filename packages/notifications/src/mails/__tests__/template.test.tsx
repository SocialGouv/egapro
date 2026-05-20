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
	it("renders the DSFR brand line, info-bar title and footer notice", async () => {
		const { html, text } = await renderEmail(
			<EmailShell previewText="Sample">
				<EmailGreeting>Bonjour</EmailGreeting>
				<EmailParagraph>Body</EmailParagraph>
			</EmailShell>,
		);
		// Bloc-marque DSFR — drapeau + ministère + devise
		expect(html).toContain("Ministère");
		expect(html).toContain("du travail");
		expect(html).toContain("et des solidarités");
		expect(html).toContain("Liberté");
		expect(html).toContain("Égalité");
		expect(html).toContain("Fraternité");
		// Direction signataire (colonne droite header + footer)
		expect(html).toContain("Direction Générale du Travail");
		// Info bar
		expect(html).toContain("Egapro");
		expect(html).toContain("Indicateurs");
		expect(html).toContain("femmes-hommes");
		// Drapeau RF en SVG inline
		expect(html).toContain("Drapeau français");
		// Pictogramme récépissé dans la barre d'info
		expect(html).toContain("Récépissé");
		// Body
		expect(html).toContain("Bonjour");
		expect(html).toContain("Body");
		// Footer
		expect(html).toContain("envoyé automatiquement");
		expect(html).toContain(getPublicUrl());
		expect(text).toContain("Bonjour");
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
	it("renders a DSFR button plus the URL as a visible underlined link", async () => {
		const href = "https://test.example/connexion";
		const { html } = await renderEmail(
			<EmailShell previewText="t">
				<EmailCtaWithLink href={href} label="Commencer ma déclaration" />
			</EmailShell>,
		);
		expect(html).toContain("Commencer ma déclaration");
		expect(html).toContain(href);
		expect(html).toContain("underline");
		const occurrences = html.split(href).length - 1;
		expect(occurrences).toBeGreaterThanOrEqual(2);
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
