import type PDFDocument from "@react-pdf/pdfkit";
import type { PDFStructureElement } from "@react-pdf/pdfkit";

import type { LayoutNode } from "./layoutNode";
import { PDF_STRUCTURE_PROP, type PdfStructure } from "./pdfStructure";

type OpenElement = { tag: string; element: PDFStructureElement };

const CONTENT_NODE_TYPES = new Set(["TEXT", "IMAGE"]);

const CONTENT_HOLDER_TAGS = new Set([
	"H1",
	"H2",
	"H3",
	"H4",
	"P",
	"Lbl",
	"LBody",
	"TH",
	"TD",
]);

const BORDER_WIDTHS = [
	"borderTopWidth",
	"borderRightWidth",
	"borderBottomWidth",
	"borderLeftWidth",
] as const;

function readStructure(node: LayoutNode): PdfStructure | undefined {
	const structure = node.props?.[PDF_STRUCTURE_PROP];
	return typeof structure === "object" && structure !== null
		? (structure as PdfStructure)
		: undefined;
}

function isDecorated(node: LayoutNode): boolean {
	const style = node.style ?? {};
	if (typeof style.backgroundColor === "string") return true;
	return BORDER_WIDTHS.some((width) => {
		const value = style[width];
		return typeof value === "number" && value > 0;
	});
}

function withoutChildren(node: LayoutNode): LayoutNode {
	return {
		...node,
		type: node.type === "PAGE" ? "VIEW" : node.type,
		children: [],
	};
}

export class TaggedLayoutRenderer {
	// A node react-pdf splits across pages keeps its props object on every
	// fragment: keying on it keeps one structure element for the whole node.
	private readonly openElements = new Map<object, OpenElement>();

	constructor(
		private readonly document: PDFDocument,
		private readonly draw: (node: LayoutNode) => void,
	) {}

	render(layout: LayoutNode): void {
		const root = this.document.struct("Document");
		this.document.addStructure(root);
		const parent = { tag: "Document", element: root };

		(layout.children ?? []).forEach((page, index) => {
			this.renderPage(page, parent, index === 0);
		});

		root.end();
	}

	private renderPage(
		page: LayoutNode,
		parent: OpenElement,
		isFirstPage: boolean,
	): void {
		const { width = 0, height = 0 } = page.box ?? {};
		const dpi = typeof page.props?.dpi === "number" ? page.props.dpi : 72;
		this.document.addPage({
			size: [width, height],
			margin: 0,
			userUnit: dpi / 72,
		});
		if (isDecorated(page)) this.drawArtifact(withoutChildren(page), "Layout");
		this.renderChildren(page, parent, isFirstPage);
	}

	private renderChildren(
		node: LayoutNode,
		parent: OpenElement,
		isFirstPage: boolean,
	): void {
		this.document.save();
		if (node.box) this.document.translate(node.box.left, node.box.top);
		for (const child of node.children ?? []) {
			this.renderNode(child, parent, isFirstPage);
		}
		this.document.restore();
	}

	private renderNode(
		node: LayoutNode,
		parent: OpenElement,
		isFirstPage: boolean,
	): void {
		const structure = readStructure(node);
		const repeatsOnEveryPage = node.props?.fixed === true;

		if (structure?.tag === "Artifact" || (repeatsOnEveryPage && !isFirstPage)) {
			this.drawArtifact(node, "Pagination");
			return;
		}

		if (CONTENT_NODE_TYPES.has(node.type)) {
			this.renderContent(node, parent, structure);
			return;
		}

		if (isDecorated(node)) this.drawArtifact(withoutChildren(node), "Layout");
		const group = structure ? this.open(structure, structure, parent) : parent;
		this.renderChildren(node, group, isFirstPage);
	}

	private renderContent(
		node: LayoutNode,
		parent: OpenElement,
		structure: PdfStructure | undefined,
	): void {
		if (!structure && node.type === "IMAGE") {
			this.drawArtifact(node, "Layout");
			return;
		}

		const owner = this.contentOwner(node, parent, structure);
		const content = this.document.markStructureContent(owner.tag);
		this.draw(node);
		this.document.endMarkedContent();
		owner.element.add(content);
	}

	private contentOwner(
		node: LayoutNode,
		parent: OpenElement,
		structure: PdfStructure | undefined,
	): OpenElement {
		if (structure) return this.open(structure, structure, parent);
		if (CONTENT_HOLDER_TAGS.has(parent.tag)) return parent;
		return this.open({ tag: "P" }, node.props ?? node, parent);
	}

	private open(
		structure: PdfStructure,
		identity: object,
		parent: OpenElement,
	): OpenElement {
		const existing = this.openElements.get(identity);
		if (existing) return existing;

		const element = this.document.struct(
			structure.tag,
			structure.tag === "Figure" ? { alt: structure.alt } : {},
		);
		if (structure.tag === "TH") {
			element.dictionary.data.A = {
				O: "Table",
				Scope: structure.scope,
				...(structure.columnSpan ? { ColSpan: structure.columnSpan } : {}),
			};
		}
		parent.element.add(element);

		const opened = { tag: structure.tag, element };
		this.openElements.set(identity, opened);
		return opened;
	}

	private drawArtifact(node: LayoutNode, type: "Layout" | "Pagination"): void {
		this.document.markContent("Artifact", { type });
		this.draw(node);
		this.document.endMarkedContent();
	}
}
