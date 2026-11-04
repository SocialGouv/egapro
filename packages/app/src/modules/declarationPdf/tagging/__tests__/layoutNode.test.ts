import { describe, expect, it } from "vitest";

import { withoutEmptyRuns } from "../layoutNode";

describe("withoutEmptyRuns", () => {
	it("drops the glyph-less, zero-width runs of line breaks, at any depth", () => {
		const text = {
			type: "TEXT",
			lines: [
				{
					runs: [
						{ glyphs: [{ id: 37 }], xAdvance: 6 },
						{ glyphs: [], xAdvance: 0 },
						{},
						{ glyphs: [], xAdvance: 4 },
					],
				},
			],
		};

		expect(withoutEmptyRuns({ type: "VIEW", children: [text] })).toEqual({
			type: "VIEW",
			lines: undefined,
			children: [
				{
					type: "TEXT",
					lines: [
						{
							runs: [
								{ glyphs: [{ id: 37 }], xAdvance: 6 },
								{ glyphs: [], xAdvance: 4 },
							],
						},
					],
					children: undefined,
				},
			],
		});
	});
});
