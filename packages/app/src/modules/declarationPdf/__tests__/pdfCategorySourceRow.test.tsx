// @vitest-environment node

import { Document, Page, pdf, Text, View } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { makeCategory } from "~/modules/declaration-remuneration/recapitulatif/__tests__/fixtures";

import { styles } from "../recapPdfStyles";
import { CategorySection } from "../sections/CategorySection";
import type { DeclarationPdfData } from "../types";
import { DECLARATION_DATA } from "./helpers/pdfDocumentFixtures";
import {
	collectPdfTextBoxes,
	type PdfTextBox,
	readPdfLayout,
} from "./helpers/pdfLayout";
import { registerPdfFonts } from "./helpers/registerPdfFonts";

registerPdfFonts();

function makeData(): DeclarationPdfData {
	return {
		...DECLARATION_DATA,
		categories: [
			makeCategory({ name: "Ouvriers", womenCount: 10, menCount: 15 }),
		],
		source: "Accord d'entreprise",
	};
}

async function renderSection(): Promise<PdfTextBox[]> {
	let layout: ReturnType<typeof readPdfLayout> | undefined;
	await pdf(
		<Document
			onRender={(props) => {
				layout = readPdfLayout(props);
			}}
		>
			<Page size="A4" style={styles.page} wrap>
				<View style={styles.content}>
					<CategorySection data={makeData()} />
					<Text style={styles.infoLabel}>Témoin</Text>
				</View>
			</Page>
		</Document>,
	).toBuffer();
	if (!layout) throw new Error("onRender never delivered the layout data");

	const boxes: PdfTextBox[] = [];
	collectPdfTextBoxes(layout, 0, 0, boxes);
	return boxes;
}

function findText(boxes: PdfTextBox[], prefix: string): PdfTextBox {
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
		expect(value.left).toBeGreaterThanOrEqual(
			label.left + styles.infoLabelColumn.width,
		);
		expect(categoryBanner.top).toBeGreaterThanOrEqual(
			Math.max(label.bottom, value.bottom),
		);

		const witness = findText(boxes, "Témoin");
		expect(label.height).toBe(2 * witness.height);
	}, 120_000);
});
