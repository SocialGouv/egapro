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
const FRENCH_DIACRITICS = "éèêëàâùûîïôöçÉÈÊÀÇ";
const GLYPH_ID_LENGTH = 4;

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
	superscript: { verticalAlign: "super" },
});

type PositionedRun = {
	glyphIds: string[];
	x: number;
	y: number;
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

function splitGlyphIds(textShowingOperands: string): string[] {
	const ids: string[] = [];

	for (const [, hex] of textShowingOperands.matchAll(/<([0-9a-f]+)>/g)) {
		if (!hex) continue;
		for (let i = 0; i < hex.length; i += GLYPH_ID_LENGTH) {
			ids.push(hex.slice(i, i + GLYPH_ID_LENGTH));
		}
	}

	return ids;
}

function extractPositionedRuns(stream: string): PositionedRun[] {
	const runs: PositionedRun[] = [];
	let position: { x: number; y: number } | null = null;

	for (const line of stream.split("\n")) {
		const textMatrix = /^1 0 0 1 (-?[\d.]+) (-?[\d.]+) Tm$/.exec(line);
		if (textMatrix?.[1] && textMatrix[2]) {
			position = { x: Number(textMatrix[1]), y: Number(textMatrix[2]) };
			continue;
		}

		if (line.startsWith("[<") && position) {
			runs.push({ glyphIds: splitGlyphIds(line), ...position });
		}
	}

	return runs;
}

async function renderPositionedRuns(
	content: React.ReactNode,
): Promise<PositionedRun[]> {
	const pdf = await renderToBuffer(
		<Document>
			<Page size="A4" style={styles.page}>
				<Text style={styles.sample}>{content}</Text>
			</Page>
		</Document>,
	);

	return extractPositionedRuns(extractTextStream(pdf));
}

describe("PDF accent rendering", () => {
	it("draws one precomposed glyph per accented letter, never a detached mark", async () => {
		const runs = await renderPositionedRuns(FRENCH_DIACRITICS);
		const glyphIds = runs.flatMap((run) => run.glyphIds);

		expect(glyphIds).toHaveLength([...FRENCH_DIACRITICS].length);
		expect(runs).toHaveLength(1);
	});

	it("lifts a superscript run by a fraction of the font size", async () => {
		const runs = await renderPositionedRuns(
			<>
				m<Text style={styles.superscript}>2</Text>
			</>,
		);

		const [base, superscript] = runs;
		if (!base || !superscript) {
			throw new Error(`Expected 2 positioned runs, got ${runs.length}`);
		}

		const rise = superscript.y - base.y;

		expect(rise).toBeGreaterThan(0);
		expect(rise).toBeLessThan(FONT_SIZE);
	});
});
