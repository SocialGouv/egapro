import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { representationFixture } from "./__fixtures__/representation";
import { RepresentationTab } from "./RepresentationTab";
import { INDICATOR_TOOLTIPS } from "./tooltips";

function renderTab(overrides = {}, year = 2027) {
	return render(
		<RepresentationTab
			representation={representationFixture(overrides)}
			year={year}
		/>,
	);
}

function describedTexts(): string[] {
	return screen
		.getAllByRole("button")
		.map((button) => button.getAttribute("aria-describedby"))
		.filter((id): id is string => id !== null)
		.map((id) => document.getElementById(id)?.textContent ?? "");
}

describe("RepresentationTab", () => {
	it("draws both representation cards under the Rixain notice", () => {
		renderTab();

		expect(
			screen.getByRole("heading", { name: "Écarts de représentation" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Seuil réglementaire : 30 % (Loi Rixain – obligation depuis le 1ᵉʳ mars 2026, 40 % attendus en 2029)",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Représentation parmi les cadres dirigeants"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Représentation parmi les membres des instances dirigeantes",
			),
		).toBeInTheDocument();
	});

	it("raises the announced target once the campaign has reached it", () => {
		renderTab({ year: 2029 }, 2029);

		expect(
			screen.getByText(
				"Seuil réglementaire : 40 % (Loi Rixain – obligation depuis le 1ᵉʳ mars 2026)",
			),
		).toBeInTheDocument();
	});

	it("wires each help bubble to its trigger", () => {
		renderTab();

		const described = describedTexts();
		expect(described).toContain(INDICATOR_TOOLTIPS.executives);
		expect(described).toContain(INDICATOR_TOOLTIPS.members);
	});

	it("shows the figures both as a legend and in the details table", () => {
		renderTab();

		expect(screen.getAllByText("25 %").length).toBeGreaterThan(0);
		expect(screen.getAllByText("75 %").length).toBeGreaterThan(0);
		expect(
			screen.getAllByRole("button", { name: "Détails des données" }),
		).toHaveLength(2);
	});

	it.each([
		["aucun_cadre_dirigeant", "ne compte aucun cadre dirigeant"],
		["un_seul_cadre_dirigeant", "compte un seul cadre dirigeant"],
	] as const)("explains why executives are not computable: %s", (reason, sentence) => {
		renderTab({ notComputableReasonExecutives: reason });

		expect(screen.getByText(new RegExp(sentence))).toBeInTheDocument();
		expect(screen.getByText("Écart non calculable")).toBeInTheDocument();
	});

	it("explains why the governing bodies are not computable", () => {
		renderTab({ notComputableReasonMembers: "aucune_instance_dirigeante" });

		expect(
			screen.getByText(/ne compte aucune instance dirigeante/),
		).toBeInTheDocument();
	});

	it("drops the help bubble from a card that has no figure to explain", () => {
		renderTab({ notComputableReasonExecutives: "aucun_cadre_dirigeant" });

		const described = describedTexts();
		expect(described).not.toContain(INDICATOR_TOOLTIPS.executives);
		expect(described).toContain(INDICATOR_TOOLTIPS.members);
	});

	it("says so when the company published no representation declaration", () => {
		render(<RepresentationTab representation={null} year={2027} />);

		expect(
			screen.getByText(
				"Aucune déclaration de représentation équilibrée pour 2027",
			),
		).toBeInTheDocument();
	});
});
