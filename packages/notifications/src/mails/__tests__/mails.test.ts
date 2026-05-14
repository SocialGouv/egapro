import { describe, expect, it } from "vitest";

import { escapeHtml, formatSiren, getPublicUrl } from "../helpers.js";
import {
	buildMail,
	isNotificationType,
	MAIL_BUILDERS,
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
} from "../index.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "../view/shell.js";

const SAMPLE: NotificationPayloadMap = {
	declaration_confirmation: { siren: "552100554", year: 2025 },
	second_declaration_confirmation: { siren: "552100554", year: 2025 },
	cse_opinion_receipt: { siren: "552100554", year: 2025 },
	joint_evaluation_submitted: { siren: "552100554", year: 2025 },
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
			SAMPLE[type] as NotificationPayloadMap[typeof type],
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

	it("paragraph returns non-empty HTML", () => {
		expect(paragraph("Hello")).toContain("Hello");
	});
});

describe("helpers", () => {
	it("escapeHtml escapes XSS-relevant characters", () => {
		expect(escapeHtml(`<script>&'"`)).toBe("&lt;script&gt;&amp;&#39;&quot;");
	});

	it("formatSiren applies the 3-3-3 grouping", () => {
		expect(formatSiren("552100554")).toBe("552 100 554");
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
	it("declaration_confirmation references the year and SIREN", () => {
		const tpl = buildMail("declaration_confirmation", {
			siren: "552100554",
			year: 2025,
		});
		expect(tpl.subject).toContain("2025");
		expect(tpl.subject.toLowerCase()).toContain("déclaration");
		expect(tpl.html).toContain("552 100 554");
		expect(tpl.html).toContain("récapitulatif");
	});

	it("second_declaration_confirmation mentions 'seconde'", () => {
		const tpl = buildMail("second_declaration_confirmation", {
			siren: "552100554",
			year: 2025,
		});
		expect(tpl.subject.toLowerCase()).toContain("seconde");
		expect(tpl.html).toContain("552 100 554");
	});

	it("cse_opinion_receipt mentions the CSE", () => {
		const tpl = buildMail("cse_opinion_receipt", {
			siren: "552100554",
			year: 2025,
		});
		expect(tpl.subject).toContain("CSE");
		expect(tpl.html).toContain("552 100 554");
	});

	it("joint_evaluation_submitted confirms the upload", () => {
		const tpl = buildMail("joint_evaluation_submitted", {
			siren: "552100554",
			year: 2025,
		});
		expect(tpl.subject).toContain("2025");
		expect(tpl.subject).toContain("rapport d'évaluation conjointe");
		expect(tpl.html).toContain("552 100 554");
		expect(tpl.html).toContain("évaluation conjointe");
		expect(tpl.html).toContain("Prochaine étape");
	});
});
