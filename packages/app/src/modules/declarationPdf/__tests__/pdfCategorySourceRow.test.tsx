// @vitest-environment node

import type { OnRenderProps } from "@react-pdf/renderer";
import { Document, Page, pdf, View } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { makeCategory } from "~/modules/declaration-remuneration/recapitulatif/__tests__/fixtures";
import { noPayGapReferences } from "~/test/gipGapFixtures";

import { styles } from "../recapPdfStyles";
import { CategorySection } from "../sections/CategorySection";
import type { DeclarationPdfData } from "../types";
import { registerPdfFonts } from "./helpers/registerPdfFonts";

registerPdfFonts();

type LayoutNode = {
	type: string;
	value?: string;
	box?: { top?: number; left?: number; height?: number };
	children?: LayoutNode[];
};

type TextBox = {
	text: string;
	top: number;
	bottom: number;
	left: number;
	height: number;
};

function readLayout(props: OnRenderProps): LayoutNode {
	const layout = (props as { _INTERNAL__LAYOUT__DATA_?: LayoutNode })
		._INTERNAL__LAYOUT__DATA_;
	if (!layout) throw new Error("onRender did not expose the layout data");
	return layout;
}

function textOf(node: LayoutNode): string {
	if (node.type === "TEXT_INSTANCE") return node.value ?? "";
	return (node.children ?? []).map(textOf).join("");
}

function collect(
	node: LayoutNode,
	parentTop: number,
	parentLeft: number,
	out: TextBox[],
): void {
	const top = parentTop + (node.box?.top ?? 0);
	const left = parentLeft + (node.box?.left ?? 0);
	if (
		(node.type === "TEXT" || node.type === "TEXT_INSTANCE") &&
		node.box?.height !== undefined
	) {
		out.push({
			text: textOf(node).trim(),
			top,
			bottom: top + node.box.height,
			left,
			height: node.box.height,
		});
	}
	for (const child of node.children ?? []) collect(child, top, left, out);
}

function makeData(): DeclarationPdfData {
	return {
		year: 2026,
		workforceYear: 2025,
		isSecondDeclaration: false,
		indicatorGRequired: true,
		transmittedAt: "05/03/2026",
		referencePeriod: "01/01/2025 - 31/12/2025",
		declarant: { name: "Jean Martin", email: "[EMAIL_REDACTED]", phone: "" },
		company: {
			name: "Société Démo",
			siren: "123456789",
			address: "",
			nafCode: null,
			nafLabel: null,
			workforceDisplay: "250",
		},
		totalWomen: 0,
		totalMen: 0,
		hourlyWomen: 0,
		hourlyMen: 0,
		step2Data: {} as DeclarationPdfData["step2Data"],
		step3Data: {} as DeclarationPdfData["step3Data"],
		step4Data: { annual: [], hourly: [] },
		step2Gaps: noPayGapReferences(),
		step3Gaps: noPayGapReferences(),
		categories: [
			makeCategory({ name: "Ouvriers", womenCount: 10, menCount: 15 }),
		],
		source: "Accord d'entreprise",
	};
}

async function renderSection(): Promise<TextBox[]> {
	let layout: LayoutNode | null = null;
	await pdf(
		<Document
			onRender={(props) => {
				layout = readLayout(props);
			}}
		>
			<Page size="A4" style={styles.page} wrap>
				<View style={styles.content}>
					<CategorySection data={makeData()} />
				</View>
			</Page>
		</Document>,
	).toBuffer();
	if (!layout) throw new Error("onRender never delivered the layout data");

	const boxes: TextBox[] = [];
	collect(layout, 0, 0, boxes);
	return boxes;
}

function findText(boxes: TextBox[], prefix: string): TextBox {
	const box = boxes.find((candidate) => candidate.text.startsWith(prefix));
	if (!box) throw new Error(`No text starting with "${prefix}" in the layout`);
	return box;
}

describe("PDF category source row (#5039)", () => {
	it("lays the source value beside its label instead of under it", async () => {
		const boxes = await renderSection();
		const label = findText(boxes, "Source des catégories");
		const value = findText(boxes, "Accord d'entreprise");
		const categoryBanner = findText(boxes, "Catégorie d'emplois n°1");

		expect(value.height).toBeGreaterThan(0);
		expect(value.top).toBe(label.top);
		expect(value.left - label.left).toBe(styles.infoLabelColumn.width);
		expect(categoryBanner.top).toBeGreaterThanOrEqual(
			Math.max(label.bottom, value.bottom),
		);

		const heading = findText(boxes, "Indicateurs par catégorie d'emplois");
		expect(label.height).toBe(2 * heading.height);
	}, 120_000);
});
