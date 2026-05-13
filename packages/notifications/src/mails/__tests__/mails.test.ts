import { describe, expect, it } from "vitest";

import {
	buildMail,
	isNotificationType,
	MAIL_BUILDERS,
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
} from "../index.js";
import {
	escapeHtml,
	formatFrenchDate,
	formatSiren,
	getPublicUrl,
} from "../helpers.js";
import {
	calloutWarning,
	ctaButton,
	infoList,
	paragraph,
	wrapEmail,
} from "../shell.js";

const SAMPLE_PAYLOADS: NotificationPayloadMap = {
	declaration_submitted: { siren: "552100554", year: 2025 },
	second_declaration_submitted: { siren: "552100554", year: 2025 },
	cse_opinion_submitted: { siren: "552100554", year: 2025 },
	joint_evaluation_submitted: { siren: "552100554", year: 2025 },
	campaign_opening: { year: 2025, deadlineIso: "2026-03-01T00:00:00.000Z" },
	second_declaration_reminder: {
		siren: "552100554",
		year: 2025,
		deadlineIso: "2026-03-01T00:00:00.000Z",
	},
	annual_deadline_reminder: {
		siren: "552100554",
		year: 2025,
		deadlineIso: "2026-03-01T00:00:00.000Z",
	},
};

describe("mail registry", () => {
	it("registers a builder for every notification type", () => {
		for (const type of NOTIFICATION_TYPES) {
			expect(MAIL_BUILDERS[type]).toBeTypeOf("function");
		}
	});

	it.each(NOTIFICATION_TYPES)("renders a valid mail for %s", (type) => {
		const result = buildMail(
			type,
			SAMPLE_PAYLOADS[type] as NotificationPayloadMap[typeof type],
		);
		expect(result.subject).toBeTypeOf("string");
		expect(result.subject.length).toBeGreaterThan(0);
		expect(result.html.startsWith("<!doctype html>")).toBe(true);
		expect(result.html).toContain('lang="fr"');
		expect(result.html).toContain("</html>");
	});

	it("throws on unknown notification type", () => {
		expect(() =>
			buildMail(
				"does_not_exist" as NotificationType,
				{
					siren: "x",
					year: 2025,
				} as never,
			),
		).toThrow(/Unknown notification type/);
	});
});

describe("isNotificationType", () => {
	it("accepts every registered type", () => {
		for (const type of NOTIFICATION_TYPES) {
			expect(isNotificationType(type)).toBe(true);
		}
	});

	it.each([null, undefined, 0, true, {}, "nope"])("rejects %s", (value) => {
		expect(isNotificationType(value)).toBe(false);
	});
});

describe("DSFR shell rendering", () => {
	it("wraps the body with République Française header", () => {
		const html = wrapEmail({ title: "T", intro: "I", body: "<p>B</p>" });
		expect(html).toContain("République Française");
		expect(html).toContain("Liberté · Égalité · Fraternité");
		expect(html).toContain("Égalité Professionnelle");
		expect(html).toContain("Plateforme Egapro");
	});

	it("uses the DSFR blue france primary color", () => {
		const html = wrapEmail({ title: "T", body: "<p>B</p>" });
		expect(html).toContain("#000091");
	});

	it("renders the public URL in the footer", () => {
		const html = wrapEmail({ title: "T", body: "<p>B</p>" });
		expect(html).toContain(getPublicUrl());
	});

	it("infoList renders rows as a styled table", () => {
		const html = infoList([
			{ label: "SIREN", value: "552 100 554" },
			{ label: "Année", value: 2025 },
		]);
		expect(html).toContain("SIREN");
		expect(html).toContain("552 100 554");
		expect(html).toContain("Année");
		expect(html).toContain("2025");
	});

	it("ctaButton renders an accessible link with DSFR blue", () => {
		const html = ctaButton({ label: "Action", href: "https://example.fr/x" });
		expect(html).toContain('href="https://example.fr/x"');
		expect(html).toContain('rel="noopener"');
		expect(html).toContain(">Action<");
		expect(html).toContain("#000091");
	});

	it("paragraph and calloutWarning return non-empty HTML", () => {
		expect(paragraph("Hello")).toContain("Hello");
		expect(calloutWarning("Watch out")).toContain("Watch out");
	});
});

describe("helpers", () => {
	it("escapeHtml escapes XSS-relevant characters", () => {
		expect(escapeHtml(`<script>&'"`)).toBe("&lt;script&gt;&amp;&#39;&quot;");
	});

	it("formatSiren applies the 3-3-3 grouping", () => {
		expect(formatSiren("552100554")).toBe("552 100 554");
	});

	it("formatFrenchDate uses French locale", () => {
		const formatted = formatFrenchDate("2026-03-01T00:00:00.000Z");
		expect(formatted).toContain("2026");
		expect(formatted).toMatch(
			/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/,
		);
	});

	it("getPublicUrl falls back to the default Egapro URL", () => {
		const previous = process.env.EGAPRO_PUBLIC_URL;
		delete process.env.EGAPRO_PUBLIC_URL;
		try {
			expect(getPublicUrl()).toBe("https://egapro.travail.gouv.fr");
		} finally {
			if (previous !== undefined) process.env.EGAPRO_PUBLIC_URL = previous;
		}
	});
});

describe("per-type rendering details", () => {
	it("declaration_submitted includes the formatted SIREN and a CTA", () => {
		const tpl = buildMail("declaration_submitted", {
			siren: "552100554",
			year: 2025,
		});
		expect(tpl.subject).toContain("2025");
		expect(tpl.html).toContain("552 100 554");
		expect(tpl.html).toContain("Accéder à mon espace");
	});

	it("second_declaration_submitted shows the compliance callout", () => {
		const tpl = buildMail("second_declaration_submitted", {
			siren: "552100554",
			year: 2025,
		});
		expect(tpl.html).toContain("obligations complémentaires");
	});

	it("reminder mails render the deadline in French", () => {
		const tpl = buildMail("annual_deadline_reminder", {
			siren: "552100554",
			year: 2025,
			deadlineIso: "2026-03-01T00:00:00.000Z",
		});
		expect(tpl.html).toContain("2026");
		expect(tpl.html).toMatch(/mars/);
	});

	it("campaign_opening references the campaign year in subject and body", () => {
		const tpl = buildMail("campaign_opening", {
			year: 2026,
			deadlineIso: "2027-03-01T00:00:00.000Z",
		});
		expect(tpl.subject).toContain("2026");
		expect(tpl.html).toContain("2026");
		expect(tpl.html).toContain("Commencer ma déclaration");
	});
});
