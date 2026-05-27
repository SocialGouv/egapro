import { describe, expect, it } from "vitest";

import {
	buildMail,
	isNotificationType,
	MAIL_BUILDERS,
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
} from "../index.js";

const SIREN = "552100554";
const YEAR = 2027;

const PAYLOADS: NotificationPayloadMap = {
	declaration_confirmation: { siren: SIREN, year: YEAR },
	second_declaration_confirmation: { siren: SIREN, year: YEAR },
	cse_opinion_receipt: { siren: SIREN, year: YEAR },
	joint_evaluation_submitted: { siren: SIREN, year: YEAR },
};

describe("mail registry", () => {
	it("registers a builder for every notification type", () => {
		for (const type of NOTIFICATION_TYPES) {
			expect(MAIL_BUILDERS[type]).toBeTypeOf("function");
		}
	});

	it.each(NOTIFICATION_TYPES)("renders a valid mail for %s", async (type) => {
		const result = await buildMail(
			type,
			PAYLOADS[type] as NotificationPayloadMap[typeof type],
		);
		expect(result.subject).toBeTypeOf("string");
		expect(result.subject.length).toBeGreaterThan(0);
		expect(result.html).toMatch(/<!DOCTYPE html/i);
		expect(result.html).toContain('lang="fr"');
		expect(result.html).toContain("</html>");
		expect(result.text).toBeTypeOf("string");
		expect(result.text.length).toBeGreaterThan(0);
	});

	it("throws on unknown notification type", async () => {
		await expect(
			buildMail(
				"does_not_exist" as NotificationType,
				{
					siren: "x",
					year: 2025,
				} as never,
			),
		).rejects.toThrow(/Unknown notification type/);
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

describe("per-type rendering details", () => {
	it("declaration_confirmation acknowledges the declaration", async () => {
		const mail = await buildMail("declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
		});
		expect(mail.subject).toBe(
			"Egapro - Accusé de réception de votre déclaration des indicateurs",
		);
		expect(mail.html.toLowerCase()).toContain("récapitulatif");
		expect(mail.html).toContain("/connexion");
	});

	it("second_declaration_confirmation mentions the corrective second declaration", async () => {
		const mail = await buildMail("second_declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
		});
		expect(mail.subject).toBe(
			"Egapro - Accusé de réception de votre seconde déclaration",
		);
		expect(mail.html.toLowerCase()).toContain("actions correctives");
		expect(mail.html).toContain("/connexion");
	});

	it("cse_opinion_receipt mentions CSE", async () => {
		const mail = await buildMail("cse_opinion_receipt", {
			siren: SIREN,
			year: YEAR,
		});
		expect(mail.subject).toBe("Egapro - Réception de l'avis du CSE");
		expect(mail.html).toContain("CSE");
		expect(mail.html).toContain("/connexion");
	});

	it("joint_evaluation_submitted confirms upload", async () => {
		const mail = await buildMail("joint_evaluation_submitted", {
			siren: SIREN,
			year: YEAR,
		});
		expect(mail.subject).toContain("évaluation conjointe");
		expect(mail.html.toLowerCase()).toContain("évaluation conjointe");
		expect(mail.html).toContain("Prochaine étape");
	});
});

describe("HTML safety", () => {
	it("does not leak raw HTML from a payload field even when builders ignore it", async () => {
		const mail = await buildMail("declaration_confirmation", {
			siren: "<script>alert(1)</script>",
			year: YEAR,
		});
		expect(mail.html).not.toContain("<script>alert(1)</script>");
	});
});
