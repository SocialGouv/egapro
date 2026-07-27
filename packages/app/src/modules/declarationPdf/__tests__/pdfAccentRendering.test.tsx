// @vitest-environment node

import { createRequire } from "node:module";
import { inflateSync } from "node:zlib";

import {
	Document,
	Font,
	Page,
	renderToBuffer,
	StyleSheet,
	Text,
} from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { PDF_FONT_FAMILY } from "../pdfFonts";

const FONT_SIZE = 100;
const MAX_MARK_OFFSET_RATIO = 0.75;

const marianneRegular = createRequire(import.meta.url).resolve(
	"@gouvfr/dsfr/dist/fonts/Marianne-Regular.woff",
);

Font.register({
	family: PDF_FONT_FAMILY,
	fonts: [{ src: marianneRegular, fontWeight: 400 }],
});

const styles = StyleSheet.create({
	page: { fontFamily: PDF_FONT_FAMILY, padding: 0 },
	sample: { fontSize: FONT_SIZE },
});

type GlyphDraw = {
	hex: string;
	x: number;
};

function extractTextStream(pdf: Buffer): string {
	const inflateFailures: string[] = [];
	let cursor = 0;

	while (cursor < pdf.length) {
		const streamStart = pdf.indexOf("stream", cursor);
		if (streamStart === -1) break;

		let contentStart = streamStart + "stream".length;
		if (pdf[contentStart] === 0x0d) contentStart += 1;
		if (pdf[contentStart] === 0x0a) contentStart += 1;

		const contentEnd = pdf.indexOf("endstream", contentStart);
		cursor = contentEnd + "endstream".length;

		try {
			const content = inflateSync(
				pdf.subarray(contentStart, contentEnd),
			).toString("latin1");
			if (content.includes("Tf") && content.includes("TJ")) return content;
		} catch (error) {
			inflateFailures.push(`${streamStart}: ${String(error)}`);
		}
	}

	throw new Error(
		`No text content stream found in the rendered PDF (${inflateFailures.length} stream(s) could not be inflated: ${inflateFailures.join(" | ")})`,
	);
}

function extractGlyphDraws(stream: string): GlyphDraw[] {
	const draws: GlyphDraw[] = [];
	let x: number | null = null;

	for (const line of stream.split("\n")) {
		const position = /^1 0 0 1 (-?[\d.]+) -?[\d.]+ Tm$/.exec(line);
		if (position?.[1]) {
			x = Number(position[1]);
			continue;
		}

		const glyphs = /^\[<([0-9a-f]+)>/.exec(line);
		if (glyphs?.[1] && x !== null) draws.push({ hex: glyphs[1], x });
	}

	return draws;
}

async function renderGlyphDraws(text: string): Promise<GlyphDraw[]> {
	const pdf = await renderToBuffer(
		<Document>
			<Page size="A4" style={styles.page}>
				<Text style={styles.sample}>{text}</Text>
			</Page>
		</Document>,
	);

	return extractGlyphDraws(extractTextStream(pdf));
}

function asGlyphTriplet(draws: GlyphDraw[]): [GlyphDraw, GlyphDraw, GlyphDraw] {
	const [base, mark, repeatedBase] = draws;

	if (!base || !mark || !repeatedBase || draws.length !== 3) {
		throw new Error(
			`Expected a base glyph, its combining mark and the repeated base, got ${draws.length} draw(s)`,
		);
	}

	return [base, mark, repeatedBase];
}

async function expectMarkDrawnOverBase(accented: string, base: string) {
	const [first, mark, second] = asGlyphTriplet(
		await renderGlyphDraws(`${accented}${base}`),
	);

	const baseAdvance = second.x - first.x;
	const markOffset = mark.x - first.x;

	expect(second.hex).toBe(first.hex);
	expect(mark.hex).not.toBe(first.hex);
	expect(baseAdvance).toBeGreaterThan(0);
	expect(markOffset).toBeGreaterThan(0);
	expect(markOffset).toBeLessThan(MAX_MARK_OFFSET_RATIO * baseAdvance);
}

describe("PDF accent rendering", () => {
	it("draws the combining acute over its base letter, not at its advance", async () => {
		await expectMarkDrawnOverBase("é", "e");
	});

	it("draws the combining cedilla over its base letter, not at its advance", async () => {
		await expectMarkDrawnOverBase("ç", "c");
	});
});
