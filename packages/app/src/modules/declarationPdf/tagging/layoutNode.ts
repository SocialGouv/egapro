type LayoutBox = { left: number; top: number; width: number; height: number };

type LayoutRun = { glyphs?: unknown[]; xAdvance?: number };

type LayoutLine = { runs: LayoutRun[] };

export type LayoutNode = {
	type: string;
	box?: LayoutBox;
	style?: Record<string, unknown>;
	props?: Record<string, unknown>;
	lines?: LayoutLine[];
	children?: LayoutNode[];
};

function drawsSomething(run: LayoutRun): boolean {
	return (run.glyphs?.length ?? 0) > 0 || (run.xAdvance ?? 0) !== 0;
}

// textkit gives each "\n" its own glyph-less run in the standard Helvetica,
// and drawing it still selects that never-embedded font in the content stream.
export function withoutEmptyRuns(node: LayoutNode): LayoutNode {
	return {
		...node,
		lines: node.lines?.map((line) => ({
			...line,
			runs: line.runs.filter(drawsSomething),
		})),
		children: node.children?.map(withoutEmptyRuns),
	};
}
