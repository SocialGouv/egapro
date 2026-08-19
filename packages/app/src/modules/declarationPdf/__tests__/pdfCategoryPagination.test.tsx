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

// Banners that must never end up alone at a page bottom.
const BANNER =
	/^(Catégorie d'emplois n°\d+|Écart de rémunération par catégories)/;

// A @react-pdf LayoutNode: box.top is parent-relative, only TEXT carries height.
type LayoutNode = {
	type: string;
	value?: string;
	box?: { top?: number; height?: number };
	children?: LayoutNode[];
};

// react-pdf exposes the laid-out tree on onRender but omits it from its public type.
function readLayout(props: OnRenderProps): LayoutNode {
	const layout = (props as { _INTERNAL__LAYOUT__DATA_?: LayoutNode })
		._INTERNAL__LAYOUT__DATA_;
	if (!layout) throw new Error("onRender did not expose the layout data");
	return layout;
}

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

// A banner as the bottom-most text of a page means its block wrapped without it.
function orphanedBanners(layout: LayoutNode): string[] {
	const orphans: string[] = [];
	for (const page of layout.children ?? []) {
		const texts: PageText[] = [];
		for (const child of page.children ?? []) collectPageTexts(child, 0, texts);
		const printed = texts.filter((entry) => entry.text.length > 0);
		if (printed.length === 0) continue;
		const last = printed.reduce((a, b) => (b.bottom > a.bottom ? b : a));
		if (BANNER.test(last.text)) orphans.push(last.text);
	}
	return orphans;
}

function makeData(): DeclarationPdfData {
	return {
		year: 2026,
		workforceYear: 2025,
		isSecondDeclaration: false,
		transmittedAt: "05/03/2026",
		referencePeriod: "01/01/2025 - 31/12/2025",
		declarant: { name: "Jean Martin", email: "email@example.fr", phone: "" },
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
		step2Data: {} as DeclarationPdfData["step2Data"],
		step3Data: {} as DeclarationPdfData["step3Data"],
		step4Data: { annual: [], hourly: [] },
		step2Gaps: noPayGapReferences(),
		step3Gaps: noPayGapReferences(),
		// Varied heights so the sweep lands banners at many distances from the bottom.
		categories: [
			makeCategory({ name: "Ouvriers", womenCount: 10, menCount: 15 }),
			makeCategory({
				name: "Employés",
				womenCount: 30,
				menCount: 20,
				annualBaseWomen: "40000",
				annualBaseMen: "42000",
				annualVariableWomen: "1000",
				annualVariableMen: "2000",
			}),
			makeCategory({ name: "Techniciens", womenCount: 5, menCount: 8 }),
			makeCategory({
				name: "Cadres",
				womenCount: 12,
				menCount: 18,
				hourlyBaseWomen: "22",
				hourlyBaseMen: "24",
			}),
		],
		source: "Accord d'entreprise",
	};
}

async function renderWithFiller(fillerHeight: number): Promise<LayoutNode> {
	let layout: LayoutNode | null = null;
	// Mirrors DeclarationPdfDocument; the filler stands in for the sections above.
	const document = (
		<Document
			onRender={(props) => {
				layout = readLayout(props);
			}}
		>
			<Page size="A4" style={styles.page} wrap>
				<View style={{ height: fillerHeight }} />
				<View style={styles.content}>
					<CategorySection data={makeData()} />
				</View>
			</Page>
		</Document>
	);

	await pdf(document).toBuffer();

	if (!layout) throw new Error("onRender never delivered the layout data");
	return layout;
}

describe("PDF category pagination", () => {
	it("never leaves a category or section banner at the bottom of a page", async () => {
		const offenders: { filler: number; banners: string[] }[] = [];

		// Step 3pt: the regression spans ~75pt of filler, so a coarser sweep still
		// samples it dozens of times while keeping the render count affordable.
		for (let fillerHeight = 560; fillerHeight <= 700; fillerHeight += 3) {
			const banners = orphanedBanners(await renderWithFiller(fillerHeight));
			if (banners.length > 0) offenders.push({ filler: fillerHeight, banners });
		}

		expect(offenders).toEqual([]);
	}, 120_000); // 47 full PDF renders on real fonts, slower again under coverage.

	it("keeps each category heading on the same page as its effectif table", async () => {
		// At this filler the first category no longer fits: wrap={false} must hold.
		const layout = await renderWithFiller(600);

		const bannerPage = new Map<string, number>();
		const tablePage = new Map<string, number>();
		let pageIndex = 0;
		for (const page of layout.children ?? []) {
			const texts: PageText[] = [];
			for (const child of page.children ?? [])
				collectPageTexts(child, 0, texts);
			const headings = texts
				.map((entry) => entry.text)
				.filter((text) => /^Catégorie d'emplois n°\d+/.test(text));
			for (const heading of headings) bannerPage.set(heading, pageIndex);
			// The effectif table's row label marks the page holding the table body.
			if (texts.some((entry) => entry.text === "Nombre de salariés")) {
				for (const heading of headings) tablePage.set(heading, pageIndex);
			}
			pageIndex += 1;
		}

		expect(bannerPage.size).toBeGreaterThan(0);
		for (const [heading, page] of bannerPage) {
			expect(tablePage.get(heading)).toBe(page);
		}
	});
});
