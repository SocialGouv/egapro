import { computeGap } from "../../shared/gapUtils";
import type { StepCategoryData } from "../../types";

export type ParsedCategory = {
	index: number;
	name: string;
	annualBaseGap: number | null;
	annualVariableGap: number | null;
	hourlyBaseGap: number | null;
	hourlyVariableGap: number | null;
};

/** Parses step 5 category data into structured gap information per category */
export function parseStep5Categories(
	step5Categories: StepCategoryData[],
): ParsedCategory[] {
	const catIndices = new Set<number>();
	for (const c of step5Categories) {
		const match = c.name.match(/^cat:(\d+):/);
		if (match) catIndices.add(Number.parseInt(match[1] as string, 10));
	}

	const result: ParsedCategory[] = [];
	for (const idx of [...catIndices].sort((a, b) => a - b)) {
		const nameRow = step5Categories.find((c) =>
			c.name.startsWith(`cat:${idx}:name:`),
		);
		const catName =
			nameRow?.name.replace(`cat:${idx}:name:`, "") ||
			`Catégorie d'emplois n°${idx + 1}`;

		const annualBase = step5Categories.find(
			(c) => c.name === `cat:${idx}:annual:base`,
		);
		const annualVariable = step5Categories.find(
			(c) => c.name === `cat:${idx}:annual:variable`,
		);
		const hourlyBase = step5Categories.find(
			(c) => c.name === `cat:${idx}:hourly:base`,
		);
		const hourlyVariable = step5Categories.find(
			(c) => c.name === `cat:${idx}:hourly:variable`,
		);

		result.push({
			index: idx,
			name: catName,
			annualBaseGap:
				annualBase?.womenValue && annualBase?.menValue
					? computeGap(annualBase.womenValue, annualBase.menValue)
					: null,
			annualVariableGap:
				annualVariable?.womenValue && annualVariable?.menValue
					? computeGap(annualVariable.womenValue, annualVariable.menValue)
					: null,
			hourlyBaseGap:
				hourlyBase?.womenValue && hourlyBase?.menValue
					? computeGap(hourlyBase.womenValue, hourlyBase.menValue)
					: null,
			hourlyVariableGap:
				hourlyVariable?.womenValue && hourlyVariable?.menValue
					? computeGap(hourlyVariable.womenValue, hourlyVariable.menValue)
					: null,
		});
	}

	return result;
}
