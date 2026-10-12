// @vitest-environment node

import type { OnRenderProps } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import { cloneElement, type ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { PrefillPdfDocument } from "../PrefillPdfDocument";
import { makePrefillData } from "./helpers/prefillFixtures";
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

type PageText = { text: string; bottom: number };

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
		out.push({ text: textOf(node).trim(), bottom: top + node.box.height });
	}
	for (const child of node.children ?? []) collectPageTexts(child, top, out);
}

async function renderLayout(): Promise<PageText[][]> {
	let layout: LayoutNode | undefined;
	const document = cloneElement(
		PrefillPdfDocument({ data: makePrefillData() }) as ReactElement<{
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
});
