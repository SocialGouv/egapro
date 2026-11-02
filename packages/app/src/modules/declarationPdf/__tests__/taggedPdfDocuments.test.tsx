// @vitest-environment node

import { describe, expect, it } from "vitest";

import { renderTaggedPdf } from "../tagging/renderTaggedPdf";
import { pdfDocumentSamples } from "./helpers/pdfDocumentFixtures";
import {
	flattenTags,
	isMarkedAsTagged,
	nonEmbeddedFonts,
	type PdfStructureNode,
	parsePdf,
	readCatalog,
	readInfoTitle,
	readPageContent,
	readParentTreeContent,
	readStructureTree,
	readXmpMetadata,
} from "./helpers/pdfInspection";
import { registerPdfFonts } from "./helpers/registerPdfFonts";

registerPdfFonts({ hyphenation: true });

function headingLevels(tags: PdfStructureNode[]): number[] {
	return tags
		.map((node) => /^H(\d)$/.exec(node.tag)?.[1])
		.filter((level): level is string => level !== undefined)
		.map(Number);
}

function contentKey({ page, mcid }: { page: number; mcid: number }): string {
	return `${page}:${mcid}`;
}

describe.each(pdfDocumentSamples())("$name PDF (PDF/UA-1)", (sample) => {
	const rendered = renderTaggedPdf(sample.element).then(parsePdf);

	it("declares itself tagged, in French, PDF/UA-1, with its title shown", async () => {
		const pdf = await rendered;
		const catalog = readCatalog(pdf);

		expect(isMarkedAsTagged(pdf)).toBe(true);
		expect(catalog).toContain("/Lang (fr-FR)");
		expect(catalog).toMatch(/\/ViewerPreferences \d+ 0 R/);
		expect(readInfoTitle(pdf)).toBe(sample.title);
		const xmp = readXmpMetadata(pdf);
		expect(xmp).toContain("<pdfuaid:part>1</pdfuaid:part>");
		expect(xmp).toContain(sample.title);
	});

	it("leaves no drawn content outside a tag or an artifact", async () => {
		const pdf = await rendered;
		const { markedContent, unmarkedOperators } = readPageContent(pdf);
		const { taggedContent } = readStructureTree(pdf);

		expect(unmarkedOperators).toEqual([]);
		expect(markedContent.length).toBeGreaterThan(0);
		expect(new Set(taggedContent.map(contentKey))).toEqual(
			new Set(markedContent.map(contentKey)),
		);
		expect(new Set(readParentTreeContent(pdf).map(contentKey))).toEqual(
			new Set(markedContent.map(contentKey)),
		);
	});

	it("opens on its title as the single H1, without skipping heading levels", async () => {
		const tags = flattenTags(readStructureTree(await rendered).root);
		const levels = headingLevels(tags);

		expect(tags[0]?.tag).toBe("Document");
		expect(levels[0]).toBe(1);
		expect(levels.filter((level) => level === 1)).toHaveLength(1);
		for (const [index, level] of levels.entries()) {
			expect(level - (levels[index - 1] ?? 0)).toBeLessThanOrEqual(1);
		}
	});

	it("gives every table header cell a scope and every figure an alternative", async () => {
		const tags = flattenTags(readStructureTree(await rendered).root);

		for (const header of tags.filter((node) => node.tag === "TH")) {
			expect(header.attributes).toMatch(/\/Scope \/(Column|Row)/);
		}
		for (const figure of tags.filter((node) => node.tag === "Figure")) {
			expect(figure.alt).toBeTruthy();
		}
		for (const row of tags.filter((node) => node.tag === "TR")) {
			expect(row.children.every((cell) => /^T[HD]$/.test(cell.tag))).toBe(true);
		}
		for (const item of tags.filter((node) => node.tag === "LI")) {
			expect(item.children.map((child) => child.tag)).toEqual(["Lbl", "LBody"]);
		}
	});

	it("embeds every font it draws with", async () => {
		expect(nonEmbeddedFonts(await rendered)).toEqual([]);
	});
}, 30_000);

describe("document-specific structure", { timeout: 30_000 }, () => {
	const tagsOf = async (name: string) => {
		const sample = pdfDocumentSamples().find((entry) => entry.name === name);
		if (!sample) throw new Error(`unknown sample ${name}`);
		return flattenTags(
			readStructureTree(parsePdf(await renderTaggedPdf(sample.element))).root,
		);
	};

	it("tags the declaration's indicator grids as tables with row and column headers", async () => {
		const tags = await tagsOf("declaration");
		const attributes = tags
			.filter((node) => node.tag === "TH")
			.map((node) => node.attributes);

		expect(tags.filter((node) => node.tag === "Table").length).toBeGreaterThan(
			5,
		);
		expect(attributes).toContain("<< /O /Table /Scope /Column >>");
		expect(attributes).toContain("<< /O /Table /Scope /Row >>");
		expect(attributes).toContain("<< /O /Table /Scope /Column /ColSpan 2 >>");
		expect(attributes).toContain("<< /O /Table /Scope /Row /ColSpan 3 >>");
	});

	it("names the issuing ministry through the header logo's alternative text", async () => {
		const tags = await tagsOf("declaration");

		expect(tags.find((node) => node.tag === "Figure")?.alt).toBe(
			"Ministère du Travail et des Solidarités. Liberté, Égalité, Fraternité",
		);
	});

	it("gives each CSE file mark the label the HTML recap reads out", async () => {
		const tags = await tagsOf("cse-opinion");

		expect(
			tags.filter((node) => node.tag === "Figure").map((node) => node.alt),
		).toEqual([
			"Ministère du Travail et des Solidarités. Liberté, Égalité, Fraternité",
			"Avis associé",
			"Non associé",
		]);
	});
});
