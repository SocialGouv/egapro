import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Document: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", { "data-testid": "pdf-document" }, children),
		Page: ({ children }: { children: React.ReactNode }) =>
			React.createElement("section", { "data-testid": "pdf-page" }, children),
		Text: ({
			children,
			render: renderProp,
		}: {
			children?: React.ReactNode;
			render?: (props: { pageNumber: number; totalPages: number }) => string;
		}) =>
			React.createElement(
				"span",
				null,
				renderProp ? renderProp({ pageNumber: 1, totalPages: 3 }) : children,
			),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		Image: () => React.createElement("div", { "data-testid": "pdf-image" }),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

vi.mock("../pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
	ensurePdfFontsRegistered: vi.fn(),
}));

import type { GipPrefillData } from "~/modules/declaration-remuneration";
import {
	formatVariablePayProportion,
	GIP_WORKFORCE_VOLUNTARY_DISPLAY,
} from "~/modules/domain";
import { PrefillPdfDocument } from "../PrefillPdfDocument";
import {
	DEMO_COMPANY,
	makeGip,
	makePrefillData,
} from "./helpers/prefillFixtures";

type Overrides = Parameters<typeof makePrefillData>[0];

function renderPrefill(overrides: Overrides = {}) {
	return render(<PrefillPdfDocument data={makePrefillData(overrides)} />);
}

function emptyGip(): Partial<GipPrefillData> {
	const gip = makeGip();
	const nullify = <T extends object>(block: T): T =>
		Object.fromEntries(Object.keys(block).map((key) => [key, null])) as T;
	return {
		step1: nullify(gip.step1),
		step2: nullify(gip.step2),
		step3: nullify(gip.step3),
		step4: {
			annual: {
				thresholds: [null, null, null],
				womenCounts: [null, null, null, null],
				menCounts: [null, null, null, null],
			},
			hourly: {
				thresholds: [null, null, null],
				womenCounts: [null, null, null, null],
				menCounts: [null, null, null, null],
			},
		},
		periodStart: null,
		periodEnd: null,
	};
}

describe("PrefillPdfDocument", () => {
	it("lays out the maquette blocks from a complete GIP row", () => {
		renderPrefill();

		expect(
			screen.getByText(
				"Données préremplies : Déclaration des indicateurs de rémunération 2027",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Source : DSN (Déclarations Sociales Nominatives)"),
		).toBeInTheDocument();
		expect(screen.getByText("Informations entreprise")).toBeInTheDocument();
		expect(screen.getByText("Société Démo")).toBeInTheDocument();
		expect(screen.getByText("123 456 789")).toBeInTheDocument();
		expect(screen.getByText("Information calcul")).toBeInTheDocument();
		expect(screen.getByText("01/01/2026 - 31/12/2026")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Effectifs physiques pris en compte pour le calcul des indicateurs",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Écart de rémunération")).toBeInTheDocument();
		expect(
			screen.getByText("Écart de rémunération variable ou complémentaire"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Proportion de femmes et d'hommes dans chaque quartile de rémunération",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Données préremplies : Déclaration des indicateurs de rémunération 2027 - SIREN 123 456 789",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Page 1/3")).toBeInTheDocument();
	});

	it.each([
		["37.00", GIP_WORKFORCE_VOLUNTARY_DISPLAY],
		[null, GIP_WORKFORCE_VOLUNTARY_DISPLAY],
	])("shows the voluntary bracket for a workforceEma of %s", (workforceEma, expected) => {
		renderPrefill({ workforceEma });

		expect(screen.getByText(expected)).toBeInTheDocument();
		expect(screen.queryByText("37")).not.toBeInTheDocument();
		expect(screen.queryByText("37.00")).not.toBeInTheDocument();
	});

	it("keeps the exact headcount at or above the threshold", () => {
		renderPrefill({ workforceEma: "250.00" });

		expect(screen.getByText("250")).toBeInTheDocument();
		expect(
			screen.queryByText(GIP_WORKFORCE_VOLUNTARY_DISPLAY),
		).not.toBeInTheDocument();
	});

	it("prints the published GIP gap rather than one recomputed from the amounts", () => {
		renderPrefill({
			gip: {
				step2: {
					...makeGip().step2,
					annualMeanWomen: "40000",
					annualMeanMen: "50000",
					annualMeanGap: "0.0887",
				},
			},
		});

		expect(screen.getByText("8,87 %")).toBeInTheDocument();
		expect(screen.queryByText("20,00 %")).not.toBeInTheDocument();
	});

	it("prints unsigned gaps with their badge and favored sex", () => {
		renderPrefill({
			gip: {
				step2: {
					...makeGip().step2,
					annualMeanGap: "0.0717",
					hourlyMeanGap: "-0.03168",
					annualMedianGap: "0",
					hourlyMedianWomen: null,
					hourlyMedianMen: null,
					hourlyMedianGap: null,
				},
			},
		});

		expect(screen.getByText("7,17 %")).toBeInTheDocument();
		expect(screen.getByText("3,16 %")).toBeInTheDocument();
		expect(screen.queryByText("-3,16 %")).not.toBeInTheDocument();
		expect(screen.getByText("en faveur des femmes")).toBeInTheDocument();
		expect(screen.getAllByText("ÉLEVÉ").length).toBeGreaterThan(0);
	});

	it("prints dashes, never null, NaN or undefined, for empty GIP columns", () => {
		const { container } = renderPrefill({
			gip: {
				...emptyGip(),
				step2: {
					...makeGip().step2,
					annualMeanWomen: null,
					annualMeanGap: null,
				},
			},
		});

		expect(screen.getAllByText("-").length).toBeGreaterThan(0);
		expect(screen.getAllByText("- %").length).toBeGreaterThan(0);
		expect(screen.getAllByText("- €").length).toBeGreaterThan(0);
		expect(container.textContent).not.toMatch(/null|NaN|undefined/);
	});

	it("hides the calculation block when the GIP period is unknown", () => {
		renderPrefill({ gip: { periodStart: null, periodEnd: null } });

		expect(screen.queryByText("Information calcul")).not.toBeInTheDocument();
		expect(screen.queryByText("Période de référence")).not.toBeInTheDocument();
	});

	it("computes the variable-pay proportions from the headcounts, ignoring the GIP ratio", () => {
		renderPrefill();

		expect(
			screen.getByText(formatVariablePayProportion(60, 120)),
		).toBeInTheDocument();
		expect(screen.queryByText(/Indice de confiance/)).not.toBeInTheDocument();
	});

	it.each([
		[true, "Oui"],
		[false, "Non"],
		[null, "Non renseigné"],
	])("shows the CSE line above the obligation threshold (%s → %s)", (hasCse, expected) => {
		renderPrefill({ company: { ...DEMO_COMPANY, hasCse } });

		expect(screen.getByText("Existence d'un CSE")).toBeInTheDocument();
		expect(screen.getByText(expected)).toBeInTheDocument();
	});

	it("hides the CSE line below the obligation threshold", () => {
		renderPrefill({ workforceEma: "80.00" });

		expect(screen.queryByText("Existence d'un CSE")).not.toBeInTheDocument();
	});
});
