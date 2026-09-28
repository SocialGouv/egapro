import { inflateSync } from "node:zlib";

// A rendered PDF stores its drawing instructions in deflated content streams.
// Inflating the one that positions text gives back the `Tm` matrices and the
// `TJ` operands, which is the only way to assert on what the layout engine
// actually produced rather than on what we asked it to produce.

const GLYPH_ID_LENGTH = 4;

export type PositionedRun = {
	glyphIds: string[];
	x: number;
	y: number;
};

export function extractTextStream(pdf: Buffer): string {
	const inflateFailures: string[] = [];
	let cursor = 0;

	while (cursor < pdf.length) {
		const streamStart = pdf.indexOf("stream", cursor);
		if (streamStart === -1) break;

		let contentStart = streamStart + "stream".length;
		if (pdf[contentStart] === 0x0d) contentStart += 1;
		if (pdf[contentStart] === 0x0a) contentStart += 1;

		const contentEnd = pdf.indexOf("endstream", contentStart);
		// Without this guard a truncated buffer yields -1, subarray() slices the
		// whole file, and the cursor rewinds to 8 — an infinite loop.
		if (contentEnd === -1) break;

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

export function extractPositionedRuns(stream: string): PositionedRun[] {
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
