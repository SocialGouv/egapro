// @vitest-environment node

import type { OnRenderProps } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import { cloneElement, type ReactElement } from "react";
import { describe, expect, it } from "vitest";

import type { CseOpinionRecapData } from "../buildCseOpinionRecapData";
import { CseOpinionPdfDocument } from "../CseOpinionPdfDocument";
import { registerPdfFonts } from "./helpers/registerPdfFonts";

registerPdfFonts();

type LayoutNode = {
	type: string;
	value?: string;
	box?: { top?: number; height?: number };
	children?: LayoutNode[];
};

function textOf(node: LayoutNode): string {
	if (node.type === "TEXT_INSTANCE") return node.value ?? "";
	return (node.children ?? []).map(textOf).join("");
}

function collectTexts(node: LayoutNode, out: string[]): void {
	if (node.type === "TEXT") {
		const text = textOf(node).trim();
		if (text) out.push(text);
		return;
	}
	for (const child of node.children ?? []) collectTexts(child, out);
}

const opinion = (declarationNumber: 1 | 2, type: "accuracy" | "gap") => ({
	id: `${declarationNumber}:${type}`,
	title: `Avis ${type} de la déclaration ${declarationNumber}, dont l'intitulé est assez long pour tenir sur deux lignes dans le récapitulatif`,
	rows: [
		...(type === "gap"
			? [{ label: "CSE informé et consulté", value: "Oui" }]
			: []),
		{ label: "Avis du CSE", value: "Favorable" },
		{ label: "Date de l'avis rendu par le CSE", value: "07/08/2026" },
	],
});

const DATA: CseOpinionRecapData = {
	year: 2027,
	transmittedAt: "10/12/2027",
	company: { name: "Société Démo", siren: "123 456 789" },
	declarantRows: [
		{ label: "Nom Prénom", value: "Marie Dupont" },
		{ label: "Adresse email", value: "email@example.fr" },
		{ label: "Numéro de téléphone", value: "06 01 02 03 04" },
	],
	companyRows: [
		{ label: "Raison sociale", value: "Société Démo" },
		{ label: "SIREN", value: "123 456 789" },
		{ label: "Adresse", value: "12 rue des Innovateurs, 75011 Paris" },
		{ label: "Code NAF", value: "62.02A - Conseil en systèmes" },
		{ label: "Effectif annuel moyen en 2026", value: "2 256" },
		{ label: "Existence d'un CSE", value: "Oui" },
	],
	referencePeriods: [
		{
			label: "Période de référence de la première déclaration",
			value: "01/01/2026 - 31/12/2026",
		},
		{
			label: "Période de référence de la seconde déclaration",
			value: "01/02/2027 - 31/07/2027",
		},
	],
	declarations: [
		{
			declarationNumber: 1,
			title: "Première déclaration",
			opinions: [opinion(1, "accuracy"), opinion(1, "gap")],
		},
		{
			declarationNumber: 2,
			title: "Seconde déclaration",
			opinions: [opinion(2, "accuracy"), opinion(2, "gap")],
		},
	],
	fileColumns: ["1:accuracy", "1:gap", "2:accuracy", "2:gap"].map((id) => ({
		id,
		label: id.endsWith("gap") ? "Justification" : "Exactitude",
		declarationLabel: id.startsWith("1") ? "1re déclaration" : "2e déclaration",
	})),
	files: [1, 2, 3, 4].map((index) => ({
		id: `file-${index}`,
		name: `avis-cse-${index}.pdf`,
		detail: "PDF – 17,96 Ko · déposé le 17 août 2026",
		columnIds: [index % 2 ? "1:accuracy" : "1:gap"],
	})),
};

async function renderPages(): Promise<string[][]> {
	let layout: LayoutNode | undefined;
	const document = cloneElement(
		CseOpinionPdfDocument({ data: DATA }) as ReactElement<{
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
		const texts: string[] = [];
		collectTexts(page, texts);
		return texts;
	});
}

describe("CseOpinionPdfDocument pagination", () => {
	it("spreads a full transmission over several pages, each with its footer and counter", async () => {
		const pages = await renderPages();

		expect(pages.length).toBeGreaterThan(1);
		pages.forEach((texts, index) => {
			expect(texts).toContain(
				"Transmission du ou des avis du CSE 2027 - SIREN 123 456 789 - transmise le 10/12/2027",
			);
			expect(texts).toContain(`Page ${index + 1}/${pages.length}`);
		});
	}, 30_000);

	it("never splits an opinion block nor a file row between two pages", async () => {
		const pages = await renderPages();

		for (const block of DATA.declarations.flatMap((d) => d.opinions)) {
			const holding = pages.filter((texts) => texts.includes(block.title));
			expect(holding).toHaveLength(1);
			const page = holding[0] ?? [];
			const from = page.indexOf(block.title);
			expect(page.slice(from, from + 1 + block.rows.length * 2)).toEqual([
				block.title,
				...block.rows.flatMap((row) => [row.label, row.value]),
			]);
		}
		for (const file of DATA.files) {
			const page = pages.find((texts) => texts.includes(file.name)) ?? [];
			expect(page[page.indexOf(file.name) + 1]).toBe(file.detail);
		}
	}, 30_000);
});
