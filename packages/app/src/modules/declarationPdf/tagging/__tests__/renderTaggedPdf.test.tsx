// @vitest-environment node

import { join } from "node:path";
import { Document, Image, Link, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
	flattenTags,
	parsePdf,
	readCatalog,
	readInfoTitle,
	readPageContent,
	readStructureTree,
} from "../../__tests__/helpers/pdfInspection";
import { registerPdfFonts } from "../../__tests__/helpers/registerPdfFonts";
import { PDF_FONT_FAMILY } from "../../pdfFonts";
import { pdfStructure, pdfTag } from "../pdfStructure";
import { renderTaggedPdf } from "../renderTaggedPdf";

registerPdfFonts();

const LOGO = join(
	process.cwd(),
	"public",
	"assets",
	"declaration-remuneration",
	"pdf",
	"ministere-travail.png",
);

const PAGE_STYLE = { fontFamily: PDF_FONT_FAMILY, fontSize: 10, padding: 40 };

async function renderPages(children: ReactNode, pageProps = {}) {
	return parsePdf(
		await renderTaggedPdf(
			<Document title="Document de test">
				<Page size="A4" style={PAGE_STYLE} wrap {...pageProps}>
					{children}
				</Page>
			</Document>,
		),
	);
}

function tagNames(pdf: ReturnType<typeof parsePdf>): string[] {
	return flattenTags(readStructureTree(pdf).root).map((node) => node.tag);
}

describe("renderTaggedPdf", { timeout: 30_000 }, () => {
	it("refuses a document without a title, which PDF/UA-1 requires", async () => {
		await expect(
			renderTaggedPdf(
				<Document>
					<Page />
				</Document>,
			),
		).rejects.toThrow("<Document title>");
	});

	it("writes the title, defaults the language to French and omits unset metadata", async () => {
		const pdf = await renderPages(<Text>Contenu</Text>);
		const info = [...pdf.objects.values()].find((body) =>
			body.includes("/Title "),
		);

		expect(readInfoTitle(pdf)).toBe("Document de test");
		expect(readCatalog(pdf)).toContain("/Lang (fr-FR)");
		expect(info).not.toContain("/Author");
		expect(info).toContain("/Producer");
	});

	it("tags an untagged text as a paragraph, but files a cell's texts under the cell", async () => {
		const pdf = await renderPages(
			<>
				<Text>Paragraphe</Text>
				<View {...pdfTag("Table")}>
					<View {...pdfTag("TR")}>
						<View {...pdfStructure({ tag: "TH", scope: "Column" })}>
							<Text>Écart</Text>
							<Text>Seuil réglementaire : 5%</Text>
						</View>
					</View>
				</View>
			</>,
		);

		expect(tagNames(pdf)).toEqual(["Document", "P", "Table", "TR", "TH"]);
		expect(readPageContent(pdf).unmarkedOperators).toEqual([]);
	});

	it("draws backgrounds, borders, untagged images and explicit artifacts outside the structure", async () => {
		const pdf = await renderPages(
			<>
				<View style={{ backgroundColor: "#EDEDED", borderWidth: 1 }}>
					<Text {...pdfTag("H1")}>Titre</Text>
				</View>
				<Image src={LOGO} style={{ width: 40, height: 28 }} />
				<View {...pdfTag("Artifact")}>
					<Text>Pied de page</Text>
				</View>
			</>,
			{ style: { ...PAGE_STYLE, backgroundColor: "#F6F6F6" } },
		);

		expect(tagNames(pdf)).toEqual(["Document", "H1"]);
		expect(readPageContent(pdf).unmarkedOperators).toEqual([]);
	});

	it("keeps fixed page chrome as content on the first page and as an artifact afterwards", async () => {
		const pdf = await renderPages(
			<>
				<View fixed>
					<Image
						{...pdfStructure({ tag: "Figure", alt: "Logo du ministère" })}
						src={LOGO}
						style={{ width: 40, height: 28 }}
					/>
				</View>
				<Text>Première page</Text>
				<Text break>Seconde page</Text>
			</>,
		);
		const embeddedImages = [...pdf.objects.values()].filter(
			(body) => body.includes("/Subtype /Image") && body.includes("/SMask "),
		);

		expect(tagNames(pdf)).toEqual(["Document", "Figure", "P", "P"]);
		expect(readPageContent(pdf).unmarkedOperators).toEqual([]);
		expect(embeddedImages).toHaveLength(1);
	});

	it("keeps a paragraph split across two pages as one structure element", async () => {
		const pdf = await renderPages(
			<Text>
				{"Une ligne de texte assez longue pour remplir la page. ".repeat(160)}
			</Text>,
		);
		const { taggedContent } = readStructureTree(pdf);

		expect(tagNames(pdf)).toEqual(["Document", "P"]);
		expect(new Set(taggedContent.map((ref) => ref.page)).size).toBe(2);
	});

	it("honours a page resolution other than 72 dpi", async () => {
		const pdf = await renderPages(<Text>Contenu</Text>, { dpi: 144 });
		const page = [...pdf.objects.values()].find((body) =>
			body.includes("/Type /Page\n"),
		);

		expect(page).toContain("/UserUnit 2");
	});

	it("refuses a <Link>, whose annotation it would silently drop", async () => {
		await expect(
			renderPages(<Link src="https://example.fr">Lien</Link>),
		).rejects.toThrow("<LINK>");
	});

	it.each([
		["transform", { transform: "rotate(10deg)" }],
		["overflow", { overflow: "hidden" as const }],
	])("refuses the %s style, which it would silently ignore", async (name, style) => {
		await expect(
			renderPages(
				<View style={style}>
					<Text>Contenu</Text>
				</View>,
			),
		).rejects.toThrow(`"${name}" style`);
	});
});
