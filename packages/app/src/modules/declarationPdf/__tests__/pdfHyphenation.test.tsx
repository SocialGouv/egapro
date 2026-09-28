// @vitest-environment node

import { Document, Font, Page, renderToBuffer } from "@react-pdf/renderer";
import { beforeAll, describe, expect, it } from "vitest";

import { PDF_FONT_FAMILY, splitOnSoftHyphen } from "../pdfFonts";
import { styles } from "../recapPdfStyles";
import { Cell, Row, Table } from "../sections/tableParts";
import { PAY_TABLE, QUARTILE_TABLE } from "../sections/tableWidths";
import {
	extractPositionedRuns,
	extractTextStream,
} from "./helpers/pdfTextStream";
import { registerPdfFonts } from "./helpers/registerPdfFonts";

registerPdfFonts({ hyphenation: true });

const REGULAR = 400;
const BOLD = 700;
const LONG_LABEL = "Montants des tranches de rémunération horaire brute";

function styleNumber(value: string | number | undefined, name: string): number {
	if (typeof value !== "number") {
		throw new Error(`Expected ${name} to be a number, got ${String(value)}`);
	}
	return value;
}

const CELL_PADDING = styleNumber(
	styles.cell.paddingHorizontal,
	"cell.paddingHorizontal",
);
const CELL_BORDER = styleNumber(
	styles.cell.borderRightWidth,
	"cell.borderRightWidth",
);
const HEADER_FONT_SIZE = styleNumber(
	styles.cellTextBold.fontSize,
	"cellTextBold.fontSize",
);
const HINT_FONT_SIZE = styleNumber(
	styles.headerHint.fontSize,
	"headerHint.fontSize",
);

/** Room a cell actually leaves its text, once padding and grid line are paid. */
function contentWidth(columnWidth: number): number {
	return columnWidth - 2 * CELL_PADDING - CELL_BORDER;
}

async function measure(
	text: string,
	fontSize: number,
	fontWeight: number,
): Promise<number> {
	const source = Font.getFont({
		fontFamily: PDF_FONT_FAMILY,
		fontStyle: "normal",
		fontWeight,
	});
	await source.load();

	if (!source.data) throw new Error(`Font ${PDF_FONT_FAMILY} failed to load`);

	const { advanceWidth } = source.data.layout(text);

	return (advanceWidth / source.data.unitsPerEm) * fontSize;
}

async function renderHeaderCell(text: string, width: number) {
	const pdf = await renderToBuffer(
		<Document>
			<Page size="A4">
				<Table>
					<Row>
						<Cell header text={text} width={width} />
					</Row>
				</Table>
			</Page>
		</Document>,
	);

	return extractPositionedRuns(extractTextStream(pdf));
}

// Every fragment below is laid out on a line of its own — either because the
// label carries an explicit line break (QuartileSection) or because it is the
// whole cell. None may overflow, otherwise the engine has to break it.
const SINGLE_LINE_HEADERS = [
	{ text: "Pourcentage", column: QUARTILE_TABLE.num },
	{ text: "de femmes", column: QUARTILE_TABLE.num },
	{ text: "d'hommes", column: QUARTILE_TABLE.num },
	{ text: "Nombre", column: QUARTILE_TABLE.num },
	{ text: "Nombre de femmes", column: PAY_TABLE.value },
];

describe("PDF table headers", () => {
	beforeAll(async () => {
		await Font.load({ fontFamily: PDF_FONT_FAMILY, fontWeight: BOLD });
		await Font.load({ fontFamily: PDF_FONT_FAMILY, fontWeight: REGULAR });
	});

	it.each(SINGLE_LINE_HEADERS)('fits "$text" inside its column', async ({
		text,
		column,
	}) => {
		const width = await measure(text, HEADER_FONT_SIZE, BOLD);

		expect(width).toBeLessThanOrEqual(contentWidth(column));
	});

	it("fits the regulatory threshold hint inside the gap column", async () => {
		const width = await measure(
			"Seuil réglementaire : 5%",
			HINT_FONT_SIZE,
			REGULAR,
		);

		expect(width).toBeLessThanOrEqual(contentWidth(PAY_TABLE.gap));
	});
});

describe("PDF hyphenation", () => {
	it("keeps a French word whole even when its column is too narrow", async () => {
		// 40pt cannot hold "Pourcentage" at any padding. Left to its bundled
		// en-US patterns, react-pdf cuts it into "Pourcent-" + "age" — the 12th
		// glyph being the inserted hyphen (issue 4126).
		// The count is exact rather than an upper bound because the word carries
		// no ligature pair; pick another word here and that stops holding.
		const runs = await renderHeaderCell("Pourcentage", 40);
		const glyphIds = runs.flatMap((run) => run.glyphIds);

		expect(glyphIds).toHaveLength("Pourcentage".length);
		expect(runs).toHaveLength(1);
	});

	it("wraps a long label on a word boundary", async () => {
		const runs = await renderHeaderCell(LONG_LABEL, QUARTILE_TABLE.tranche * 2);
		const glyphIds = runs.flatMap((run) => run.glyphIds);

		// No hyphen is inserted, so the drawn glyphs never outnumber the label's
		// own characters — a break would add one.
		expect(runs.length).toBeGreaterThan(1);
		expect(glyphIds.length).toBeLessThanOrEqual(LONG_LABEL.length);
	});
});

describe("splitOnSoftHyphen", () => {
	it("keeps a word whole when it carries no soft hyphen", () => {
		expect(splitOnSoftHyphen("rémunération")).toEqual(["rémunération"]);
	});

	it("breaks only where the author placed a soft hyphen", () => {
		expect(splitOnSoftHyphen("rémuné­ration")).toEqual(["rémuné", "ration"]);
	});
});
