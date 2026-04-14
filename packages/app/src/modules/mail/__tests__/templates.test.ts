import { describe, expect, it } from "vitest";
import { buildCseOpinionReceipt } from "../templates/cseOpinionReceipt";
import { buildDeclarationReceipt } from "../templates/declarationReceipt";
import { buildSecondDeclarationReceipt } from "../templates/secondDeclarationReceipt";
import { escapeHtml } from "../templates/shell";

describe("mail templates", () => {
	it("builds a declaration receipt with formatted SIREN and year", () => {
		const t = buildDeclarationReceipt({ siren: "552100554", year: 2024 });
		expect(t.subject).toContain("2024");
		expect(t.html).toContain("552 100 554");
		expect(t.text).toContain("552 100 554");
		expect(t.text).toContain("2024");
	});

	it("builds a second declaration receipt", () => {
		const t = buildSecondDeclarationReceipt({
			siren: "552100554",
			year: 2024,
		});
		expect(t.subject.toLowerCase()).toContain("seconde");
	});

	it("builds a CSE opinion receipt", () => {
		const t = buildCseOpinionReceipt({ siren: "552100554", year: 2024 });
		expect(t.subject).toContain("CSE");
	});
});

describe("escapeHtml", () => {
	it("escapes every dangerous character", () => {
		expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
	});
});
