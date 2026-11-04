export const PDF_STRUCTURE_PROP = "data-pdf-structure";

export type PdfGroupTag = "Sect" | "L" | "LI" | "Table" | "TR";

export type PdfContentTag =
	| "H1"
	| "H2"
	| "H3"
	| "H4"
	| "P"
	| "Lbl"
	| "LBody"
	| "TH"
	| "TD"
	| "Figure";

export type PdfTableHeaderScope = "Column" | "Row";

export type PdfStructure =
	| { tag: PdfGroupTag }
	| { tag: Exclude<PdfContentTag, "TH" | "Figure"> }
	| { tag: "TH"; scope: PdfTableHeaderScope; columnSpan?: number }
	| { tag: "Figure"; alt: string }
	| { tag: "Artifact" };

export type PdfStructureProps = { [PDF_STRUCTURE_PROP]: PdfStructure };

export function pdfStructure(structure: PdfStructure): PdfStructureProps {
	return { [PDF_STRUCTURE_PROP]: structure };
}

export function pdfTag(
	tag: PdfGroupTag | Exclude<PdfContentTag, "TH" | "Figure"> | "Artifact",
): PdfStructureProps {
	return pdfStructure({ tag });
}

export function pdfHeading(level: 1 | 2 | 3 | 4): PdfStructureProps {
	return pdfTag(`H${level}`);
}
