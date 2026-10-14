// @vitest-environment node

import type { OnRenderProps } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import { cloneElement, type ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { PrefillPdfDocument } from "../PrefillPdfDocument";
import { DEMO_COMPANY, makePrefillData } from "./helpers/prefillFixtures";
import { registerPdfFonts } from "./helpers/registerPdfFonts";

registerPdfFonts();

const SECTION_BANNER =
	/^(Informations entreprise|Information calcul|Effectifs physiques|Écart de rémunération|Proportion de femmes et d'hommes dans chaque quartile)/;

type LayoutNode = {
	type: string;
	value?: string;
	box?: { top?: number; height?: number };
	children?: LayoutNode[];
};

type PageText = { text: string; top: number; bottom: number };

function textOf(node: LayoutNode): string {
	if (node.type === "TEXT_INSTANCE") return node.value ?? "";
	return (node.children ?? []).map(textOf).join("");
}

function collectPageTexts(
	node: LayoutNode,
	parentTop: number,
	out: PageText[],
): void {
	const top = parentTop + (node.box?.top ?? 0);
	if (node.type === "TEXT" && node.box?.height !== undefined) {
		out.push({
			text: textOf(node).trim(),
			top,
			bottom: top + node.box.height,
		});
	}
	for (const child of node.children ?? []) collectPageTexts(child, top, out);
}

async function renderLayout(data = makePrefillData()): Promise<PageText[][]> {
	let layout: LayoutNode | undefined;
	const document = cloneElement(
		PrefillPdfDocument({ data }) as ReactElement<{
			onRender?: (props: OnRenderProps) => void;
		}>,
		{
			onRender: (props: OnRenderProps) => {
				layout = (props as { _INTERNAL__LAYOUT__DATA_?: LayoutNode })
					._INTERNAL__LAYOUT__DATA_;
			},
		},
	);
	await pdf(document).toBuffer();
	if (!layout) throw new Error("onRender never delivered the layout data");

	return (layout.children ?? []).map((page) => {
		const texts: PageText[] = [];
		for (const child of page.children ?? []) collectPageTexts(child, 0, texts);
		return texts.filter((entry) => entry.text.length > 0);
	});
}

describe("PrefillPdfDocument pagination", () => {
	it("keeps labels aligned with values after long company details wrap", async () => {
		const pages = await renderLayout(
			makePrefillData({
				company: {
					...DEMO_COMPANY,
					name: "Société nationale de recherche et de développement des solutions environnementales et territoriales",
					address:
						"123 avenue des Entreprises et des Technologies Durables, bâtiment administratif de la recherche, 75001 Paris",
				},
			}),
		);
		const firstPage = pages[0];
		if (!firstPage) throw new Error("PDF page missing");
		const entry = (text: string) => {
			const found = firstPage.find((item) => item.text === text);
			if (!found) throw new Error(`PDF text missing: ${text}`);
			return found;
		};

		expect(
			entry(
				"Société nationale de recherche et de développement des solutions environnementales et territoriales",
			).bottom - entry("Raison sociale").top,
		).toBeGreaterThan(15);
		expect(
			entry(
				"123 avenue des Entreprises et des Technologies Durables, bâtiment administratif de la recherche, 75001 Paris",
			).bottom - entry("Adresse").top,
		).toBeGreaterThan(15);
		for (const [label, value] of [
			["SIREN", "123 456 789"],
			["Code NAF", "62.02A - Conseil en systèmes et logiciels informatiques"],
		] as const) {
			expect(Math.abs(entry(label).top - entry(value).top)).toBeLessThanOrEqual(
				1,
			);
		}
		expect(entry("SIREN").top).toBeGreaterThan(entry("Raison sociale").bottom);
		expect(entry("Code NAF").top).toBeGreaterThan(
			entry(
				"123 avenue des Entreprises et des Technologies Durables, bâtiment administratif de la recherche, 75001 Paris",
			).bottom,
		);
	}, 30_000);

	it("spreads a complete GIP row over several pages, each with its footer and counter", async () => {
		const pages = await renderLayout();

		expect(pages.length).toBeGreaterThan(1);
		pages.forEach((texts, index) => {
			const printed = texts.map((entry) => entry.text);
			expect(printed).toContain(
				"Données préremplies : Déclaration des indicateurs de rémunération 2027 - SIREN 123 456 789",
			);
			expect(printed).toContain(`Page ${index + 1}/${pages.length}`);
		});
	}, 30_000);

	it("never leaves a section banner alone at the bottom of a page", async () => {
		const pages = await renderLayout();

		const orphans = pages.flatMap((texts) => {
			const body = texts.filter(
				(entry) =>
					!entry.text.startsWith("Données préremplies : ") &&
					!/^Page \d+\/\d+$/.test(entry.text),
			);
			const last = body.reduce((a, b) => (b.bottom > a.bottom ? b : a));
			return SECTION_BANNER.test(last.text) ? [last.text] : [];
		});

		expect(orphans).toEqual([]);
	}, 30_000);

	it("lays each block out at the maquette's vertical position", async () => {
		const pages = await renderLayout();
		// [page, text, top in pt] read off the Figma frames of the three pages.
		const expected: [number, string, number][] = [
			[
				0,
				"Données préremplies : Déclaration des indicateurs de rémunération 2027",
				170,
			],
			[0, "Source : DSN (Déclarations Sociales Nominatives)", 200],
			[0, "Informations entreprise", 229],
			[0, "Raison sociale", 254],
			[0, "Existence d'un CSE", 349],
			[0, "Information calcul", 384],
			[0, "Période de référence", 409],
			[
				0,
				"Effectifs physiques pris en compte pour le calcul des indicateurs",
				444,
			],
			[0, "Rémunération horaire", 521.5],
			[0, "Écart de rémunération", 555],
			[0, "Horaire brute médiane", 743.5],
			[1, "Écart de rémunération variable ou complémentaire", 110],
			[1, "Rémunération variable ou complémentaire", 135],
			[1, "Proportion de femmes et d'hommes bénéficiaires", 348],
			[
				1,
				"Proportion de femmes et d'hommes dans chaque quartile de rémunération",
				465,
			],
			[1, "Rémunération annuelle brute moyenne", 490],
			[2, "Rémunération horaire brute moyenne", 106],
		];

		const drifts = expected.flatMap(([page, text, top]) => {
			const found = pages[page]?.find((entry) => entry.text === text);
			const drift = found === undefined ? Number.NaN : found.top - top;
			return Math.abs(drift) <= 1 ? [] : [{ page, text, drift }];
		});

		expect(drifts).toEqual([]);
	}, 30_000);

	it("gives every printed text, page counter included, a visible height", async () => {
		const pages = await renderLayout();

		const collapsed = pages
			.flat()
			.filter((entry) => entry.bottom <= entry.top)
			.map((entry) => entry.text);

		expect(collapsed).toEqual([]);
	}, 30_000);
});
