// @vitest-environment node

import {
	Document,
	Page,
	renderToBuffer,
	StyleSheet,
	Text,
} from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { PDF_FONT_FAMILY } from "../pdfFonts";
import {
	extractPositionedRuns,
	extractTextStream,
	type PositionedRun,
} from "./helpers/pdfTextStream";
import { registerPdfFonts } from "./helpers/registerPdfFonts";

const FONT_SIZE = 100;
const FRENCH_DIACRITICS = "éèêëàâùûîïôöçÉÈÊÀÇ";

registerPdfFonts();

const styles = StyleSheet.create({
	page: { fontFamily: PDF_FONT_FAMILY, padding: 0 },
	sample: { fontSize: FONT_SIZE },
	superscript: { verticalAlign: "super" },
});

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
