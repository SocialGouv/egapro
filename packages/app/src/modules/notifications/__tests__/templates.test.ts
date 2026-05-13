import { describe, expect, it } from "vitest";

import { buildNotificationTemplate } from "../templates";
import { escapeHtml, formatFrenchDate, wrapEmail } from "../templates/shell";
import { NOTIFICATION_TYPES, type NotificationPayloadMap } from "../types";

const SAMPLE_PAYLOADS: NotificationPayloadMap = {
	declaration_submitted: { siren: "552100554", year: 2025 },
	second_declaration_submitted: { siren: "552100554", year: 2025 },
	cse_opinion_submitted: { siren: "552100554", year: 2025 },
	joint_evaluation_submitted: { siren: "552100554", year: 2025 },
	campaign_opening: {
		year: 2025,
		deadlineIso: "2026-03-01T00:00:00.000Z",
	},
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

describe("buildNotificationTemplate", () => {
	it.each(NOTIFICATION_TYPES)("renders a non-empty template for %s", (type) => {
		const payload = SAMPLE_PAYLOADS[type];
		const tpl = buildNotificationTemplate(type, payload);
		expect(tpl.subject.length).toBeGreaterThan(0);
		expect(tpl.html).toContain("<!doctype html>");
		expect(tpl.html).toContain("</html>");
	});

	it("includes the company SIREN in declaration_submitted body", () => {
		const tpl = buildNotificationTemplate("declaration_submitted", {
			siren: "552100554",
			year: 2025,
		});
		expect(tpl.html).toContain("552 100 554");
		expect(tpl.subject).toContain("2025");
	});

	it("formats deadline date in French for reminders", () => {
		const tpl = buildNotificationTemplate("annual_deadline_reminder", {
			siren: "552100554",
			year: 2025,
			deadlineIso: "2026-03-01T00:00:00.000Z",
		});
		expect(tpl.html).toContain("2026");
		expect(tpl.html).toMatch(
			/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/,
		);
	});
});

describe("template shell helpers", () => {
	it("escapeHtml escapes the dangerous characters", () => {
		expect(escapeHtml("<script>&'\"")).toBe("&lt;script&gt;&amp;&#39;&quot;");
	});

	it("wrapEmail produces a doctype + lang=fr document", () => {
		const out = wrapEmail("Titre", "<p>Corps</p>");
		expect(out.startsWith("<!doctype html>")).toBe(true);
		expect(out).toContain('lang="fr"');
		expect(out).toContain("Corps");
	});

	it("formatFrenchDate returns dd month yyyy", () => {
		const formatted = formatFrenchDate("2026-03-01T00:00:00.000Z");
		expect(formatted).toMatch(/2026/);
	});
});
