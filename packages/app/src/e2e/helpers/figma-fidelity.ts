import { expect, type Page } from "@playwright/test";
import {
	type Deviation,
	type FidelitySpec,
	type Hex,
	hexToRgb,
	type Length,
	type Measured,
	measureInPage,
} from "~/e2e/helpers/figma-fidelity-measure";

export type { FidelitySpec };

function checkNumber(
	deviations: Deviation[],
	element: string,
	property: string,
	expected: number | undefined,
	actual: Length,
	tolerance: number,
) {
	if (expected === undefined) return;
	// A keyword (`normal`, `auto`, `none`) is not a shorter length: reporting it
	// as 0 would let a contract that expects 0 pass on an unmeasured property.
	if (actual === null) {
		deviations.push({
			element,
			property,
			expected: `${expected}px`,
			actual: "valeur calculée non numérique",
		});
		return;
	}
	if (Math.abs(actual - expected) > tolerance) {
		deviations.push({
			element,
			property,
			expected: `${expected}px`,
			actual: `${Math.round(actual * 10) / 10}px`,
		});
	}
}

function checkColor(
	deviations: Deviation[],
	element: string,
	property: string,
	expected: Hex | undefined,
	actual: string,
) {
	if (expected === undefined) return;
	const wanted = hexToRgb(expected);
	if (actual !== wanted) {
		deviations.push({
			element,
			property,
			expected: `${expected} (${wanted})`,
			actual,
		});
	}
}

function checkSides(
	deviations: Deviation[],
	element: string,
	property: string,
	expected: (number | null)[] | undefined,
	actual: Length[],
	tolerance: number,
) {
	if (!expected) return;
	const sides = ["top", "right", "bottom", "left"];
	expected.forEach((side, i) => {
		if (side === null) return;
		checkNumber(
			deviations,
			element,
			`${property}-${sides[i]}`,
			side,
			actual[i] ?? null,
			tolerance,
		);
	});
}

function formatReport(spec: FidelitySpec, deviations: Deviation[]): string {
	const header = [
		`${deviations.length} écart(s) avec le Figma « ${spec.figma.frame} »`,
		`node ${spec.figma.node} du fichier ${spec.figma.file} (relevé le ${spec.figma.capturedAt})`,
		"",
	];
	const rows = deviations.map(
		(d) =>
			`  ${d.element}.${d.property}: attendu ${d.expected}, obtenu ${d.actual}`,
	);
	return [...header, ...rows].join("\n");
}

// Collects every deviation before failing, so one run reports the whole drift.
export async function assertFigmaFidelity(page: Page, spec: FidelitySpec) {
	const tolerance = spec.tolerance ?? 1;

	// Fidelity is always judged against the light Figma frame.
	await page.evaluate(() => {
		document.documentElement.setAttribute("data-fr-scheme", "light");
		document.documentElement.setAttribute("data-fr-theme", "light");
	});

	const targets = Object.entries(spec.elements).map(([name, element]) => ({
		name,
		selector: element.selector,
		index: element.index ?? 0,
	}));
	const measures = (await page.evaluate(measureInPage, targets)) as Record<
		string,
		Measured
	>;

	const deviations: Deviation[] = [];

	for (const [name, element] of Object.entries(spec.elements)) {
		const measured = measures[name];
		if (!measured?.found) {
			deviations.push({
				element: name,
				property: "presence",
				expected: `un élément « ${element.selector} »`,
				actual: "aucun",
			});
			continue;
		}
		checkNumber(
			deviations,
			name,
			"font-size",
			element.font?.size,
			measured.fontSize,
			0,
		);
		checkNumber(
			deviations,
			name,
			"font-weight",
			element.font?.weight,
			measured.fontWeight,
			0,
		);
		checkNumber(
			deviations,
			name,
			"line-height",
			element.font?.lineHeight,
			measured.lineHeight,
			0,
		);
		checkColor(deviations, name, "color", element.color, measured.color);
		checkColor(
			deviations,
			name,
			"background-color",
			element.backgroundColor,
			measured.backgroundColor,
		);
		const sides = ["top", "right", "bottom", "left"];
		const corners = ["top-left", "top-right", "bottom-right", "bottom-left"];
		sides.forEach((side, i) => {
			checkNumber(
				deviations,
				name,
				`border-${side}-width`,
				element.border?.width,
				measured.borderWidths[i] ?? null,
				0,
			);
			checkColor(
				deviations,
				name,
				`border-${side}-color`,
				element.border?.color,
				measured.borderColors[i] ?? "",
			);
		});
		corners.forEach((corner, i) => {
			checkNumber(
				deviations,
				name,
				`border-radius-${corner}`,
				element.border?.radius,
				measured.borderRadii[i] ?? null,
				0,
			);
		});
		if (
			element.backgroundImageContains !== undefined &&
			!measured.backgroundImage.includes(element.backgroundImageContains)
		) {
			deviations.push({
				element: name,
				property: "background-image",
				expected: `contient « ${element.backgroundImageContains} »`,
				actual: measured.backgroundImage,
			});
		}
		checkSides(
			deviations,
			name,
			"padding",
			element.padding,
			measured.padding,
			tolerance,
		);
		checkSides(
			deviations,
			name,
			"margin",
			element.margin,
			measured.margin,
			tolerance,
		);
		checkNumber(
			deviations,
			name,
			"width",
			element.width,
			measured.box.width,
			tolerance,
		);
		checkNumber(
			deviations,
			name,
			"height",
			element.height,
			measured.box.height,
			tolerance,
		);
	}

	for (const gap of spec.gaps) {
		const from = measures[gap.from];
		const to = measures[gap.to];
		if (!from?.found || !to?.found) continue;
		checkNumber(
			deviations,
			`${gap.from} → ${gap.to}`,
			"gap",
			gap.expected,
			to.box.y - from.box.bottom,
			tolerance,
		);
	}

	for (const alignment of spec.alignments) {
		const [reference, ...others] = alignment.of;
		const base = reference ? measures[reference] : undefined;
		if (!reference || !base?.found) continue;
		const edge = alignment.edge === "left" ? "x" : "right";
		for (const name of others) {
			const measured = measures[name];
			if (!measured?.found) continue;
			checkNumber(
				deviations,
				name,
				`${alignment.edge}-edge (aligné sur ${reference})`,
				base.box[edge],
				measured.box[edge],
				tolerance,
			);
		}
	}

	for (const text of spec.copy ?? []) {
		await expect(
			page.getByText(text, { exact: false }).first(),
			`copy manquante : « ${text} »`,
		).toBeVisible();
	}

	expect(deviations, formatReport(spec, deviations)).toEqual([]);
}
