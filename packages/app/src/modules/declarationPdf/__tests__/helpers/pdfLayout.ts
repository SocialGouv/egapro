import type { OnRenderProps } from "@react-pdf/renderer";

export type PdfLayoutNode = {
	type: string;
	value?: string;
	box?: { top?: number; left?: number; height?: number };
	children?: PdfLayoutNode[];
};

export type PdfTextBox = {
	text: string;
	top: number;
	bottom: number;
	left: number;
	height: number;
};

export type PdfPageText = { text: string; top: number; bottom: number };

export function readPdfLayout(props: OnRenderProps): PdfLayoutNode {
	const layout = (props as { _INTERNAL__LAYOUT__DATA_?: PdfLayoutNode })
		._INTERNAL__LAYOUT__DATA_;
	if (!layout) throw new Error("onRender did not expose the layout data");
	return layout;
}

export function pdfTextOf(node: PdfLayoutNode): string {
	if (node.type === "TEXT_INSTANCE") return node.value ?? "";
	return (node.children ?? []).map(pdfTextOf).join("");
}

export function collectPdfTextBoxes(
	node: PdfLayoutNode,
	parentTop: number,
	parentLeft: number,
	out: PdfTextBox[],
): void {
	const top = parentTop + (node.box?.top ?? 0);
	const left = parentLeft + (node.box?.left ?? 0);
	if (
		(node.type === "TEXT" || node.type === "TEXT_INSTANCE") &&
		node.box?.height !== undefined
	) {
		out.push({
			text: pdfTextOf(node).trim(),
			top,
			bottom: top + node.box.height,
			left,
			height: node.box.height,
		});
	}
	for (const child of node.children ?? []) {
		collectPdfTextBoxes(child, top, left, out);
	}
}

export function collectPdfPageTexts(
	node: PdfLayoutNode,
	parentTop: number,
	out: PdfPageText[],
): void {
	const top = parentTop + (node.box?.top ?? 0);
	if (node.type === "TEXT" && node.box?.height !== undefined) {
		out.push({
			text: pdfTextOf(node).trim(),
			top,
			bottom: top + node.box.height,
		});
	}
	for (const child of node.children ?? []) {
		collectPdfPageTexts(child, top, out);
	}
}
