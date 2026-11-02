import { inflateSync } from "node:zlib";

// A minimal reader for the uncompressed object syntax pdfkit writes. It answers
// the PDF/UA-1 questions veraPDF asks — is the file tagged, titled, in French,
// and is every piece of drawn content either tagged or an artifact — so CI can
// guard them without a Java runtime.

export type PdfStructureNode = {
	tag: string;
	attributes: string | null;
	alt: string | null;
	children: PdfStructureNode[];
};

type ContentRef = { page: number; mcid: number };

type ParsedPdf = { objects: Map<number, string>; trailerInfo: number | null };

const PAINTING_OPERATOR = /(^|\s)(TJ|Tj|Do|f\*?|S|s|B\*?|b\*?)$/;
const MARKED_CONTENT_START = /(BDC|BMC)$/;

export function parsePdf(pdf: Buffer): ParsedPdf {
	const source = pdf.toString("latin1");
	const objects = new Map<number, string>();
	for (const match of source.matchAll(/(\d+) 0 obj\n([\s\S]*?)\nendobj/g)) {
		objects.set(Number(match[1]), match[2] ?? "");
	}
	const info = /\/Info (\d+) 0 R/.exec(source);
	return { objects, trailerInfo: info ? Number(info[1]) : null };
}

function objectBody(pdf: ParsedPdf, reference: number): string {
	const body = pdf.objects.get(reference);
	if (body === undefined) throw new Error(`PDF object ${reference} missing`);
	return body;
}

function referenceIn(body: string, key: string): number | null {
	const match = new RegExp(`/${key} (\\d+) 0 R`).exec(body);
	return match ? Number(match[1]) : null;
}

export function decodePdfString(literal: string): string {
	const unescaped = literal
		.replace(/^\(|\)$/g, "")
		.replace(/\\([nrtbf()\\])/g, (_, escaped: string) =>
			escaped === "n" ? "\n" : escaped === "r" ? "\r" : escaped,
		);
	if (!unescaped.startsWith("þÿ")) return unescaped;
	return Buffer.from(unescaped.slice(2), "latin1").swap16().toString("utf16le");
}

function streamText(body: string): string {
	const start = body.indexOf("stream\n") + "stream\n".length;
	const end = body.lastIndexOf("\nendstream");
	const raw = Buffer.from(body.slice(start, end), "latin1");
	return body.includes("/FlateDecode")
		? inflateSync(raw).toString("latin1")
		: raw.toString("utf8");
}

export function readCatalog(pdf: ParsedPdf): string {
	const catalog = [...pdf.objects.values()].find((body) =>
		body.includes("/Type /Catalog"),
	);
	if (!catalog) throw new Error("PDF catalog missing");
	return catalog;
}

export function readInfoTitle(pdf: ParsedPdf): string | null {
	if (pdf.trailerInfo === null) return null;
	const title = referenceIn(objectBody(pdf, pdf.trailerInfo), "Title");
	return title === null ? null : decodePdfString(objectBody(pdf, title));
}

export function readXmpMetadata(pdf: ParsedPdf): string {
	const metadata = referenceIn(readCatalog(pdf), "Metadata");
	return metadata === null ? "" : streamText(objectBody(pdf, metadata));
}

export function isMarkedAsTagged(pdf: ParsedPdf): boolean {
	const markInfo = referenceIn(readCatalog(pdf), "MarkInfo");
	return (
		markInfo !== null && objectBody(pdf, markInfo).includes("/Marked true")
	);
}

function kidsOf(body: string): string {
	const start = body.indexOf("/K [");
	return start === -1 ? "" : body.slice(start + 4, body.indexOf("]", start));
}

function collectStructure(
	pdf: ParsedPdf,
	reference: number,
	contents: ContentRef[],
): PdfStructureNode {
	const body = objectBody(pdf, reference);
	const page = referenceIn(body.replace(/\/K \[[^\]]*\]/, ""), "Pg");
	const children: PdfStructureNode[] = [];
	for (const kid of kidsOf(body).matchAll(/<<[\s\S]*?>>|(\d+) 0 R|(\d+)/g)) {
		const [token, child, mcid] = kid;
		if (child) children.push(collectStructure(pdf, Number(child), contents));
		else if (mcid && page !== null) contents.push({ page, mcid: Number(mcid) });
		else if (token.startsWith("<<")) {
			const markedPage = referenceIn(token, "Pg");
			const markedId = /\/MCID (\d+)/.exec(token)?.[1];
			if (markedPage !== null && markedId) {
				contents.push({ page: markedPage, mcid: Number(markedId) });
			}
		}
	}
	const alt = /\/Alt (\([\s\S]*?[^\\]\))\n/.exec(body)?.[1];
	return {
		tag: /\/S \/(\w+)/.exec(body)?.[1] ?? "",
		attributes:
			/\/A (<<[\s\S]*?>>)/.exec(body)?.[1]?.replace(/\s+/g, " ") ?? null,
		alt: alt ? decodePdfString(alt) : null,
		children,
	};
}

export function readStructureTree(pdf: ParsedPdf): {
	root: PdfStructureNode;
	taggedContent: ContentRef[];
} {
	const treeRoot = referenceIn(readCatalog(pdf), "StructTreeRoot");
	if (treeRoot === null) throw new Error("StructTreeRoot missing");
	const documentElement = Number(
		/\/K \[(\d+) 0 R/.exec(objectBody(pdf, treeRoot))?.[1],
	);
	const taggedContent: ContentRef[] = [];
	const root = collectStructure(pdf, documentElement, taggedContent);
	return { root, taggedContent };
}

export function flattenTags(node: PdfStructureNode): PdfStructureNode[] {
	return [node, ...node.children.flatMap(flattenTags)];
}

export function readPageContent(pdf: ParsedPdf): {
	markedContent: ContentRef[];
	unmarkedOperators: string[];
} {
	const markedContent: ContentRef[] = [];
	const unmarkedOperators: string[] = [];
	for (const [page, body] of pdf.objects) {
		if (!body.includes("/Type /Page\n")) continue;
		const contents = referenceIn(body, "Contents");
		if (contents === null) continue;
		let depth = 0;
		for (const line of streamText(objectBody(pdf, contents)).split("\n")) {
			const mcid = /^\/MCID (\d+)$/.exec(line)?.[1];
			if (mcid) markedContent.push({ page, mcid: Number(mcid) });
			if (MARKED_CONTENT_START.test(line)) depth += 1;
			else if (line === "EMC") depth -= 1;
			else if (depth === 0 && PAINTING_OPERATOR.test(line)) {
				unmarkedOperators.push(`page ${page}: ${line}`);
			}
		}
	}
	return { markedContent, unmarkedOperators };
}

export function readParentTreeContent(pdf: ParsedPdf): ContentRef[] {
	const treeRoot = referenceIn(readCatalog(pdf), "StructTreeRoot");
	const nums = /\/Nums \[([\s\S]*)\]\n>>/.exec(
		treeRoot === null ? "" : objectBody(pdf, treeRoot),
	)?.[1];
	const parentsByKey = new Map<number, number>();
	for (const entry of (nums ?? "").matchAll(/(\d+) \[([^\]]*)\]/g)) {
		parentsByKey.set(
			Number(entry[1]),
			[...(entry[2] ?? "").matchAll(/\d+ 0 R/g)].length,
		);
	}
	const linked: ContentRef[] = [];
	for (const [page, body] of pdf.objects) {
		const key = /\/StructParents (\d+)/.exec(body)?.[1];
		if (!body.includes("/Type /Page\n") || key === undefined) continue;
		const count = parentsByKey.get(Number(key)) ?? 0;
		for (let mcid = 0; mcid < count; mcid += 1) linked.push({ page, mcid });
	}
	return linked;
}

export function nonEmbeddedFonts(pdf: ParsedPdf): string[] {
	return [...pdf.objects.values()]
		.filter(
			(body) =>
				body.includes("/Type /Font") && body.includes("/Subtype /Type1"),
		)
		.map((body) => /\/BaseFont \/(\S+)/.exec(body)?.[1] ?? "?");
}
