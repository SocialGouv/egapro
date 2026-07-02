import { describe, expect, it } from "vitest";

import {
	buildMail,
	isNotificationType,
	MAIL_BUILDERS,
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
} from "../index.js";
import { getConnectionUrl, getDeclarationUrl } from "../shared/urls.js";
import {
	CSE_OPINION_RECEIPT_VARIANTS,
	DECLARATION_CONFIRMATION_VARIANTS,
} from "../types.js";

const SIREN = "552100554";
const YEAR = 2027;
const DEADLINE = "2027-06-01T00:00:00.000Z";
const RAISON_SOCIALE = "Société Démo";
const COMPLIANCE_DEADLINE = "1er septembre 2028";

const PAYLOADS: NotificationPayloadMap = {
	declaration_confirmation: {
		siren: SIREN,
		year: YEAR,
		variant: "completed",
		raisonSociale: RAISON_SOCIALE,
	},
	second_declaration_confirmation: {
		siren: SIREN,
		year: YEAR,
		variant: "completed",
		raisonSociale: RAISON_SOCIALE,
	},
	cse_opinion_receipt: {
		siren: SIREN,
		year: YEAR,
		variant: "single",
		raisonSociale: RAISON_SOCIALE,
	},
	joint_evaluation_submitted: {
		siren: SIREN,
		year: YEAR,
		variant: "completed",
		raisonSociale: RAISON_SOCIALE,
	},
	cycle_opening_info: { siren: SIREN, year: YEAR, deadline: DEADLINE },
	declaration_deadline_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: DEADLINE,
		daysRemaining: 30,
	},
	compliance_path_choice_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: "2027-07-01T00:00:00.000Z",
	},
	second_declaration_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: "2028-01-01T00:00:00.000Z",
		daysRemaining: 90,
	},
	joint_evaluation_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: "2027-09-01T00:00:00.000Z",
	},
	cse_opinion_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: "2028-03-01T00:00:00.000Z",
		variant: "compliance",
	},
	next_cycle_handover: {
		siren: SIREN,
		previousYear: YEAR,
		nextYear: YEAR + 1,
	},
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
	it("declaration_confirmation completed variant ends the process toward the user space", async () => {
		const mail = await buildMail("declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant: "completed",
			raisonSociale: RAISON_SOCIALE,
		});
		expect(mail.subject).toBe(
			"Egapro - Transmission de déclaration et fin de démarche",
		);
		expect(mail.html.toLowerCase()).toContain(
			"démarche est désormais terminée",
		);
		expect(mail.html).toContain("Mon espace");
		expect(mail.html).toContain(RAISON_SOCIALE);
	});

	it("second_declaration_confirmation variant=completed ends the process", async () => {
		const mail = await buildMail("second_declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant: "completed",
			raisonSociale: "Société Démo",
		});
		expect(mail.subject).toBe(
			"Egapro - Transmission de la seconde déclaration et fin de démarche",
		);
		expect(mail.html).toContain("Société Démo");
		expect(mail.html).toContain("552 100 554");
		expect(mail.html).toContain("Mon espace");
		expect(mail.html).toContain("/mon-espace");
	});

	it("second_declaration_confirmation variant=cse_to_deposit asks for the CSE opinion", async () => {
		const mail = await buildMail("second_declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant: "cse_to_deposit",
			raisonSociale: "Société Démo",
		});
		expect(mail.subject).toBe(
			"Egapro - Transmission de la seconde déclaration",
		);
		expect(mail.html).toContain("Déposer");
		expect(mail.html).toContain("première et la seconde déclaration");
		expect(mail.html).toContain("/declaration?siren=552100554");
	});

	it("second_declaration_confirmation variant=path_to_select names the compliance deadline", async () => {
		const mail = await buildMail("second_declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant: "path_to_select",
			raisonSociale: "Société Démo",
			complianceDeadline: DEADLINE,
		});
		expect(mail.subject).toBe(
			"Egapro - Transmission de la seconde déclaration",
		);
		expect(mail.html).toContain("Sélectionner le parcours");
		expect(mail.html).toContain("5 %");
		expect(mail.html).toContain("1ᵉʳ juin 2027");
		expect(mail.html).toContain("/declaration?siren=552100554");
	});

	it("joint_evaluation_submitted confirms upload", async () => {
		const mail = await buildMail("joint_evaluation_submitted", {
			siren: SIREN,
			year: YEAR,
		});
		expect(mail.subject).toContain("évaluation conjointe");
		expect(mail.html.toLowerCase()).toContain("évaluation conjointe");
		expect(mail.html).toContain("Prochaine étape");
		expect(mail.html).toContain("/mon-espace");
	});

	it("cycle_opening_info announces the declaration period", async () => {
		const mail = await buildMail("cycle_opening_info", {
			siren: SIREN,
			year: YEAR,
			deadline: DEADLINE,
		});
		expect(mail.subject).toBe(
			"Egapro - Ouverture de la période de déclaration des indicateurs Egapro",
		);
		expect(mail.html.toLowerCase()).toContain("1ᵉʳ juin");
		expect(mail.html).toContain("/declaration?siren=552100554");
	});

	it.each([
		30, 10,
	] as const)("declaration_deadline_reminder J-%i exposes the count", async (daysRemaining) => {
		const mail = await buildMail("declaration_deadline_reminder", {
			siren: SIREN,
			year: YEAR,
			deadline: DEADLINE,
			daysRemaining,
		});
		expect(mail.subject).toContain(`${daysRemaining} jours`);
		expect(mail.html).toContain(`${daysRemaining} jours`);
	});

	it("compliance_path_choice_reminder names the 5 % threshold", async () => {
		const mail = await buildMail("compliance_path_choice_reminder", {
			siren: SIREN,
			year: YEAR,
			deadline: "2027-07-01T00:00:00.000Z",
		});
		expect(mail.subject.toLowerCase()).toContain("parcours");
		expect(mail.html).toContain("5 %");
	});

	it.each([
		90, 30,
	] as const)("second_declaration_reminder J-%i exposes the count", async (daysRemaining) => {
		const mail = await buildMail("second_declaration_reminder", {
			siren: SIREN,
			year: YEAR,
			deadline: "2028-01-01T00:00:00.000Z",
			daysRemaining,
		});
		expect(mail.subject).toContain(`${daysRemaining} jours`);
		expect(mail.html).toContain("actions correctives");
	});

	it("joint_evaluation_reminder references the report deadline", async () => {
		const mail = await buildMail("joint_evaluation_reminder", {
			siren: SIREN,
			year: YEAR,
			deadline: "2027-09-01T00:00:00.000Z",
		});
		expect(mail.subject.toLowerCase()).toContain("évaluation conjointe");
		expect(mail.html).toContain("1ᵉʳ septembre");
		expect(mail.html).toContain("/mon-espace");
	});

	it.each([
		["compliance", "exactitude"],
		["justify_oct", "1er octobre"],
		["justify_dec", "justification"],
		["corrective", "actions correctives"],
		["joint_eval", "évaluation conjointe"],
	] as const)("cse_opinion_reminder variant=%s shows %s context", async (variant, marker) => {
		const mail = await buildMail("cse_opinion_reminder", {
			siren: SIREN,
			year: YEAR,
			deadline: "2028-03-01T00:00:00.000Z",
			variant,
		});
		expect(mail.subject).toContain("CSE");
		expect(mail.html.toLowerCase()).toContain(marker.toLowerCase());
	});

	it("next_cycle_handover announces closure and next cycle", async () => {
		const mail = await buildMail("next_cycle_handover", {
			siren: SIREN,
			previousYear: YEAR,
			nextYear: YEAR + 1,
		});
		expect(mail.subject).toBe(
			"Egapro - Clôture de votre déclaration et ouverture du prochain cycle",
		);
		expect(mail.html).toContain(String(YEAR));
		expect(mail.html).toContain(String(YEAR + 1));
		expect(mail.html).toContain("/mon-espace");
	});
});

describe("declaration_confirmation variants", () => {
	const connectionUrl = getConnectionUrl();
	// @react-email escapes "&" to "&amp;" inside href attributes
	const declarationHref = getDeclarationUrl(SIREN, YEAR).replace(/&/g, "&amp;");

	it("covers every declared variant", () => {
		expect(DECLARATION_CONFIRMATION_VARIANTS).toStrictEqual([
			"completed",
			"cse_to_deposit",
			"path_to_select",
		]);
	});

	it.each(
		DECLARATION_CONFIRMATION_VARIANTS,
	)("%s shares the common intro naming the indicators and the company", async (variant) => {
		const mail = await buildMail("declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant,
			raisonSociale: RAISON_SOCIALE,
			complianceDeadline: COMPLIANCE_DEADLINE,
		});
		expect(mail.html).toContain(
			"les indicateurs relatifs aux écarts de rémunération",
		);
		expect(mail.html).toContain(RAISON_SOCIALE);
		expect(mail.html).toContain("accuse réception de cette transmission");
		expect(mail.html).toContain("SIREN :");
		expect(mail.html).toContain(SIREN);
		expect(mail.html).toContain("au titre des données");
	});

	it("completed: subject, 'Mon espace' CTA and matching link both point to the connection URL", async () => {
		const mail = await buildMail("declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant: "completed",
			raisonSociale: RAISON_SOCIALE,
		});
		expect(mail.subject).toBe(
			"Egapro - Transmission de déclaration et fin de démarche",
		);
		expect(mail.html).toContain("Mon espace");
		expect(mail.html).toContain("démarche est désormais terminée");
		// Button and fallback link share the connection URL, so it appears at least twice
		expect(mail.html.split(connectionUrl).length - 1).toBeGreaterThanOrEqual(2);
		expect(mail.html).not.toContain("/declaration?siren=");
	});

	it("cse_to_deposit: subject, deposit CTA to the declaration URL and fallback link to the connection URL", async () => {
		const mail = await buildMail("declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant: "cse_to_deposit",
			raisonSociale: RAISON_SOCIALE,
		});
		expect(mail.subject).toBe("Egapro - Transmission de déclaration");
		expect(mail.html).toContain("Déposer l&#x27;avis");
		expect(mail.html).toContain("déposer l&#x27;avis du CSE");
		expect(mail.html).toContain(`href="${declarationHref}"`);
		expect(mail.html).toContain(`href="${connectionUrl}"`);
		expect(mail.html).toContain(`>${connectionUrl}<`);
	});

	it("path_to_select: subject, 5 % gap wording, compliance deadline and split button/link URLs", async () => {
		const mail = await buildMail("declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant: "path_to_select",
			raisonSociale: RAISON_SOCIALE,
			complianceDeadline: COMPLIANCE_DEADLINE,
		});
		expect(mail.subject).toBe("Egapro - Transmission de la déclaration");
		expect(mail.html).toContain("Sélectionner le parcours");
		expect(mail.html).toContain("supérieurs ou égaux à 5 %");
		expect(mail.html).toContain(COMPLIANCE_DEADLINE);
		expect(mail.html).toContain(`href="${declarationHref}"`);
		expect(mail.html).toContain(`>${connectionUrl}<`);
	});
});

describe("cse_opinion_receipt variants", () => {
	const buildReceipt = (
		variant: (typeof CSE_OPINION_RECEIPT_VARIANTS)[number],
	) =>
		buildMail("cse_opinion_receipt", {
			siren: SIREN,
			year: YEAR,
			variant,
			raisonSociale: RAISON_SOCIALE,
		});

	it("covers every declared variant", () => {
		expect(CSE_OPINION_RECEIPT_VARIANTS).toStrictEqual([
			"single",
			"with_gap",
			"first_and_second",
		]);
	});

	it.each(
		CSE_OPINION_RECEIPT_VARIANTS,
	)("%s ends the process with the 'Mon espace' CTA and names the company", async (variant) => {
		const mail = await buildReceipt(variant);
		expect(mail.subject).toBe("Egapro - Dépôt d'avis CSE et fin de démarche");
		expect(mail.html).toContain("accuse réception");
		expect(mail.html).toContain("démarche est désormais terminée");
		expect(mail.html).toContain("Mon espace");
		expect(mail.html).toContain("/mon-espace");
		expect(mail.html).not.toContain("/declaration?siren=");
		expect(mail.html).toContain(RAISON_SOCIALE);
		expect(mail.html).toContain("SIREN :");
		expect(mail.html).toContain(SIREN);
	});

	it("single: 'exactitude' intro without the gap bullet list", async () => {
		const mail = await buildReceipt("single");
		expect(mail.html).toContain(
			"l&#x27;avis du CSE sur l&#x27;exactitude des données et des méthodes de calcul utilisés",
		);
		expect(mail.html).not.toContain("<ul");
		expect(mail.html).not.toContain("justification éventuelle des écarts");
	});

	it("with_gap: 'les avis CSE' intro with the gap justification bullet list", async () => {
		const mail = await buildReceipt("with_gap");
		expect(mail.html).toContain("les avis CSE");
		expect(mail.html).not.toContain("première et la seconde déclaration");
		expect(mail.html).toContain("<ul");
		expect(mail.html).toContain("justification éventuelle des écarts");
	});

	it("first_and_second: names the two declarations with the gap justification bullet list", async () => {
		const mail = await buildReceipt("first_and_second");
		expect(mail.html).toContain("les avis CSE");
		expect(mail.html).toContain("première et la seconde déclaration");
		expect(mail.html).toContain("<ul");
		expect(mail.html).toContain("justification éventuelle des écarts");
	});
});

describe("HTML safety", () => {
	it("does not leak raw HTML from the raisonSociale field", async () => {
		const mail = await buildMail("declaration_confirmation", {
			siren: SIREN,
			year: YEAR,
			variant: "completed",
			raisonSociale: "<script>alert(1)</script>",
		});
		expect(mail.html).not.toContain("<script>alert(1)</script>");
	});
});
