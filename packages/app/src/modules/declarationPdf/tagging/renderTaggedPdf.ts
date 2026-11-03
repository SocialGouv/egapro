import { createHash } from "node:crypto";

import layoutDocument from "@react-pdf/layout";
import PDFDocument from "@react-pdf/pdfkit";
import renderLayout from "@react-pdf/render";
import { type DocumentProps, Font, pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { type LayoutNode, withoutEmptyRuns } from "./layoutNode";
import { PDF_LANGUAGE } from "./pdfLanguage";
import { TaggedLayoutRenderer } from "./TaggedLayoutRenderer";

type DocumentNode = Parameters<typeof layoutDocument>[0];

// The published typing drops the font store that pdf() passes as second argument.
const layoutWithFonts = layoutDocument as unknown as (
	root: DocumentNode,
	fonts: typeof Font,
) => Promise<unknown>;
type RenderContext = Parameters<typeof renderLayout>[0];
type RenderedDocument = Parameters<typeof renderLayout>[1];

function readMetadata(props: DocumentProps): Record<string, string | Date> {
	if (!props.title) {
		throw new Error("A tagged PDF needs a <Document title> (PDF/UA-1 §7.1)");
	}
	const optional = {
		Author: props.author,
		Subject: props.subject,
		Keywords: props.keywords,
	};
	return {
		Title: props.title,
		...Object.fromEntries(
			Object.entries(optional).filter(
				(entry): entry is [string, string] => entry[1] !== undefined,
			),
		),
		Creator: props.creator ?? "Egapro",
		Producer: props.producer ?? "Egapro",
		CreationDate: new Date(),
	};
}

function collectOutput(document: PDFDocument): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		document.on("data", (chunk: Buffer) => chunks.push(chunk));
		document.on("end", () => resolve(Buffer.concat(chunks)));
		document.on("error", reject);
	});
}

function imageKey(source: unknown): string {
	return Buffer.isBuffer(source)
		? createHash("sha256").update(source).digest("hex")
		: String(source);
}

// render() ends the stream and fixed nodes carry cloned image bytes: neither must re-embed an image.
function nodeDrawer(document: PDFDocument): (node: LayoutNode) => void {
	const openedImages = new Map<string, unknown>();
	const context = new Proxy(document, {
		get(target, property) {
			if (property === "end") return () => target;
			if (property === "openImage") {
				return (source: unknown) => {
					const key = imageKey(source);
					const cached = openedImages.get(key);
					if (cached) return cached;
					const image = target.openImage(source);
					openedImages.set(key, image);
					return image;
				};
			}
			const value: unknown = Reflect.get(target, property, target);
			return typeof value === "function" ? value.bind(target) : value;
		},
	}) as unknown as RenderContext;

	return (node) => {
		renderLayout(context, {
			type: "DOCUMENT",
			children: [withoutEmptyRuns(node)],
		} as unknown as RenderedDocument);
	};
}

// @react-pdf/pdfkit 5 writes ParentTree as a plain object instead of /Nums, detaching marked content from the tree.
function writeParentTreeAsNumberTree(document: PDFDocument): void {
	const root = document.getStructTreeRoot();
	const tree = document.getStructParentTree();
	const keyCount = Number(root.data.ParentTreeNextKey);
	root.data.ParentTree = {
		Nums: Array.from({ length: keyCount }, (_, key) => [
			key,
			tree.get(key),
		]).flat(),
	};
}

export async function renderTaggedPdf(
	element: ReactElement<DocumentProps>,
): Promise<Buffer> {
	const root: DocumentNode = pdf(element).container.document;
	const props: DocumentProps = root.props ?? {};
	const layout = (await layoutWithFonts(root, Font)) as LayoutNode;

	const document = new PDFDocument({
		autoFirstPage: false,
		compress: true,
		displayTitle: true,
		lang: props.language ?? PDF_LANGUAGE,
		pdfVersion: "1.7",
		subset: "PDF/UA",
		tagged: true,
		info: readMetadata(props),
	});
	const output = collectOutput(document);

	new TaggedLayoutRenderer(document, nodeDrawer(document)).render(layout);
	writeParentTreeAsNumberTree(document);
	document.end();

	return output;
}
