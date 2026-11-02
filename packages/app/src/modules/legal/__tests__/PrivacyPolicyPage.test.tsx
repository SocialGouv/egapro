import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyPage } from "../PrivacyPolicyPage";

const OVH_PDF_URL =
	"https://storage.gra.cloud.ovh.net/v1/AUTH_325716a587c64897acbef9a4a4726e38/contracts/9e74492-OVH_Data_Protection_Agreement-FR-6.0.pdf";

function guaranteesHeading() {
	return screen.getByRole("heading", {
		level: 3,
		name: "Garanties apportées par OVH, notre hébergeur",
	});
}

describe("PrivacyPolicyPage — hosting provider guarantees", () => {
	it("points the subprocessor table at the HTML summary rather than the PDF", () => {
		render(<PrivacyPolicyPage />);

		const table = screen.getByRole("table", {
			name: "Liste des sous-traitants",
		});
		const link = within(table).getByRole("link", {
			name: "Garanties apportées par OVH",
		});

		expect(link).toHaveAttribute("href", `#${guaranteesHeading().id}`);
		expect(within(table).queryByRole("link", { name: /PDF/ })).toBeNull();
	});

	it("nests the summary under the subprocessors section", () => {
		render(<PrivacyPolicyPage />);

		const headings = screen
			.getAllByRole("heading")
			.map((heading) => `${heading.tagName} ${heading.textContent}`);
		const sectionIndex = headings.indexOf(
			"H2 Qui nous aide à traiter vos données ?",
		);

		expect(sectionIndex).toBeGreaterThan(-1);
		expect(headings[sectionIndex + 1]).toBe(
			"H3 Garanties apportées par OVH, notre hébergeur",
		);
	});

	it("states the agreement's guarantees as an HTML list", () => {
		render(<PrivacyPolicyPage />);

		const list = guaranteesHeading().nextElementSibling?.nextElementSibling;
		if (!(list instanceof HTMLElement)) throw new Error("No guarantees list");
		const items = within(list)
			.getAllByRole("listitem")
			.map((item) => item.textContent);

		expect(list.tagName).toBe("UL");
		expect(items).toHaveLength(9);
		expect(items).toEqual(
			expect.arrayContaining([
				expect.stringContaining("obligation de confidentialité"),
				expect.stringContaining("violation de données"),
				expect.stringContaining("supprimer les données hébergées"),
			]),
		);
	});

	it("keeps the full PDF reachable, announced as an untagged PDF opening in a new tab", () => {
		render(<PrivacyPolicyPage />);

		const pdfLink = screen.getByRole("link", {
			name: /^Accord de protection des données d'OVH \(PDF, 460 Ko, 41 pages\)/,
		});

		expect(pdfLink).toHaveAttribute("href", OVH_PDF_URL);
		expect(pdfLink).toHaveAttribute("target", "_blank");
		expect(pdfLink).toHaveAccessibleName(/nouvelle fenêtre|nouvel onglet/);
		expect(pdfLink.closest("p")).toHaveTextContent("format PDF non balisé");
	});
});
