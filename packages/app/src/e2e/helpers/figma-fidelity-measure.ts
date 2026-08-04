// Contract shape + in-page measurement of the Figma fidelity gate. Assertions
// live in `figma-fidelity.ts`; writing rules in
// `.claude/rules/visual-quality-validation.md`.

/** A hex colour as written in the Figma variables, e.g. `#000091`. */
export type Hex = `#${string}`;

export type ElementSpec = {
	/** CSS selector, resolved against the page. */
	selector: string;
	/** Which match to take when the selector is not unique. Defaults to 0. */
	index?: number;
	font?: { size?: number; weight?: number; lineHeight?: number };
	color?: Hex;
	backgroundColor?: Hex;
	// Asserted on all four sides / corners: a card that lost one border still
	// reads correct on the top side alone.
	border?: { width?: number; color?: Hex; radius?: number };
	/** Substring the computed `background-image` must contain — DSFR draws rules and bars there, not in `border`. */
	backgroundImageContains?: string;
	/** `[top, right, bottom, left]`; `null` skips a side. */
	padding?: [number | null, number | null, number | null, number | null];
	/** `[top, right, bottom, left]`; `null` skips a side. */
	margin?: [number | null, number | null, number | null, number | null];
	width?: number;
	height?: number;
};

export type FidelitySpec = {
	screen: string;
	figma: { file: string; node: string; frame: string; capturedAt: string };
	/** Absolute tolerance in px for every geometric comparison. Defaults to 1. */
	tolerance?: number;
	elements: Record<string, ElementSpec>;
	/** Vertical distance between the bottom of `from` and the top of `to`. */
	gaps: { from: string; to: string; expected: number }[];
	/** Elements that share an edge in the Figma frame. */
	alignments: { edge: "left" | "right"; of: string[] }[];
	/** Text that must appear verbatim in the rendered screen. */
	copy?: string[];
};

export type Measured = {
	found: boolean;
	box: {
		x: number;
		y: number;
		width: number;
		height: number;
		right: number;
		bottom: number;
	};
	color: string;
	backgroundColor: string;
	fontSize: number;
	fontWeight: number;
	lineHeight: number;
	backgroundImage: string;
	borderWidths: [number, number, number, number];
	borderColors: [string, string, string, string];
	borderRadii: [number, number, number, number];
	padding: [number, number, number, number];
	margin: [number, number, number, number];
};

export type Deviation = {
	element: string;
	property: string;
	expected: string;
	actual: string;
};

export function hexToRgb(hex: Hex): string {
	const value = hex.replace("#", "");
	const full =
		value.length === 3
			? value
					.split("")
					.map((c) => c + c)
					.join("")
			: value;
	const r = Number.parseInt(full.slice(0, 2), 16);
	const g = Number.parseInt(full.slice(2, 4), 16);
	const b = Number.parseInt(full.slice(4, 6), 16);
	return `rgb(${r}, ${g}, ${b})`;
}

export const measureInPage = (
	targets: { name: string; selector: string; index: number }[],
) => {
	const px = (value: string) => Number.parseFloat(value) || 0;

	const out: Record<string, unknown> = {};
	for (const target of targets) {
		const el = document.querySelectorAll(target.selector)[target.index];
		if (!el) {
			out[target.name] = { found: false };
			continue;
		}
		const rect = el.getBoundingClientRect();
		const cs = getComputedStyle(el);
		out[target.name] = {
			found: true,
			// Document-relative on both axes: viewport coordinates would make any
			// comparison depend on the scroll position at measurement time.
			box: {
				x: rect.x + window.scrollX,
				y: rect.y + window.scrollY,
				width: rect.width,
				height: rect.height,
				right: rect.right + window.scrollX,
				bottom: rect.bottom + window.scrollY,
			},
			color: cs.color,
			backgroundColor: cs.backgroundColor,
			fontSize: px(cs.fontSize),
			fontWeight: Number.parseInt(cs.fontWeight, 10),
			lineHeight: px(cs.lineHeight),
			backgroundImage: cs.backgroundImage,
			borderWidths: [
				px(cs.borderTopWidth),
				px(cs.borderRightWidth),
				px(cs.borderBottomWidth),
				px(cs.borderLeftWidth),
			],
			borderColors: [
				cs.borderTopColor,
				cs.borderRightColor,
				cs.borderBottomColor,
				cs.borderLeftColor,
			],
			borderRadii: [
				px(cs.borderTopLeftRadius),
				px(cs.borderTopRightRadius),
				px(cs.borderBottomRightRadius),
				px(cs.borderBottomLeftRadius),
			],
			padding: [
				px(cs.paddingTop),
				px(cs.paddingRight),
				px(cs.paddingBottom),
				px(cs.paddingLeft),
			],
			margin: [
				px(cs.marginTop),
				px(cs.marginRight),
				px(cs.marginBottom),
				px(cs.marginLeft),
			],
		};
	}
	return out;
};
