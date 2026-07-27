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
		} catch {}
	}

	throw new Error("No text content stream found in the rendered PDF");
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

describe("PDF accent rendering", () => {
	it("draws the combining acute over its base letter, not after it", async () => {
		const draws = await renderGlyphDraws("é");

		expect(draws).toHaveLength(2);

		const [base, accent] = draws as [GlyphDraw, GlyphDraw];
		const offset = accent.x - base.x;

		expect(accent.hex).not.toBe(base.hex);
		expect(offset).toBeGreaterThan(0.1 * FONT_SIZE);
		expect(offset).toBeLessThan(0.45 * FONT_SIZE);
	});

	it("draws the combining cedilla under its base letter, not after it", async () => {
		const draws = await renderGlyphDraws("ç");

		expect(draws).toHaveLength(2);

		const [base, cedilla] = draws as [GlyphDraw, GlyphDraw];
		const offset = cedilla.x - base.x;

		expect(offset).toBeGreaterThan(0.1 * FONT_SIZE);
		expect(offset).toBeLessThan(0.45 * FONT_SIZE);
	});
});
