declare module "@react-pdf/pdfkit" {
	import type { Readable } from "node:stream";

	export type PDFStructureContent = { readonly refs: unknown[] };

	export type PDFStructureElement = {
		readonly dictionary: { data: Record<string, unknown> };
		add(child: PDFStructureElement | PDFStructureContent): PDFStructureElement;
		end(): void;
	};

	export type PDFDocumentOptions = {
		autoFirstPage?: boolean;
		compress?: boolean;
		displayTitle?: boolean;
		lang?: string;
		pdfVersion?: "1.4" | "1.5" | "1.6" | "1.7";
		subset?: "PDF/UA";
		tagged?: boolean;
		info?: Record<string, string | Date>;
	};

	export default class PDFDocument extends Readable {
		constructor(options?: PDFDocumentOptions);
		addPage(options: {
			size: [number, number];
			margin: number;
			userUnit: number;
		}): this;
		save(): this;
		restore(): this;
		translate(x: number, y: number): this;
		struct(
			type: string,
			options?: { alt?: string; lang?: string; title?: string },
		): PDFStructureElement;
		addStructure(element: PDFStructureElement): this;
		markContent(tag: string, options?: Record<string, unknown>): this;
		markStructureContent(
			tag: string,
			options?: Record<string, unknown>,
		): PDFStructureContent;
		endMarkedContent(): this;
		openImage(src: unknown): unknown;
		getStructTreeRoot(): { data: Record<string, unknown> };
		getStructParentTree(): { get(key: number): unknown };
		end(): void;
	}
}
