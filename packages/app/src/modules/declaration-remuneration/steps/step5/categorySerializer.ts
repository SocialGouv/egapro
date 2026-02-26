import type { StepCategoryData } from "../../types";

export type EmployeeCategory = {
	id: number;
	name: string;
	detail: string;
	womenCount: string;
	menCount: string;
	annualBaseWomen: string;
	annualBaseMen: string;
	annualVariableWomen: string;
	annualVariableMen: string;
	hourlyBaseWomen: string;
	hourlyBaseMen: string;
	hourlyVariableWomen: string;
	hourlyVariableMen: string;
};

type SerializedRow = {
	name: string;
	womenCount?: number;
	menCount?: number;
	womenValue?: string;
	menValue?: string;
};

const EMPTY_FIELDS = {
	name: "",
	detail: "",
	womenCount: "",
	menCount: "",
	annualBaseWomen: "",
	annualBaseMen: "",
	annualVariableWomen: "",
	annualVariableMen: "",
	hourlyBaseWomen: "",
	hourlyBaseMen: "",
	hourlyVariableWomen: "",
	hourlyVariableMen: "",
} as const;

export function createEmptyCategory(id: number): EmployeeCategory {
	return { id, ...EMPTY_FIELDS };
}

export function serializeCategories(
	categories: EmployeeCategory[],
	source: string,
): SerializedRow[] {
	const result: SerializedRow[] = [{ name: `meta:source:${source}` }];

	for (let i = 0; i < categories.length; i++) {
		const cat = categories[i] as EmployeeCategory;
		const p = `cat:${i}`;

		result.push({ name: `${p}:name:${cat.name}` });
		result.push({ name: `${p}:detail:${cat.detail}` });
		result.push({
			name: `${p}:effectif`,
			womenCount: cat.womenCount
				? Number.parseInt(cat.womenCount, 10)
				: undefined,
			menCount: cat.menCount ? Number.parseInt(cat.menCount, 10) : undefined,
		});
		result.push({
			name: `${p}:annual:base`,
			womenValue: cat.annualBaseWomen || undefined,
			menValue: cat.annualBaseMen || undefined,
		});
		result.push({
			name: `${p}:annual:variable`,
			womenValue: cat.annualVariableWomen || undefined,
			menValue: cat.annualVariableMen || undefined,
		});
		result.push({
			name: `${p}:hourly:base`,
			womenValue: cat.hourlyBaseWomen || undefined,
			menValue: cat.hourlyBaseMen || undefined,
		});
		result.push({
			name: `${p}:hourly:variable`,
			womenValue: cat.hourlyVariableWomen || undefined,
			menValue: cat.hourlyVariableMen || undefined,
		});
	}

	return result;
}

export function deserializeCategories(
	data: StepCategoryData[],
	nextId: () => number,
): {
	categories: EmployeeCategory[];
	source: string;
} {
	const sourceRow = data.find((d) => d.name.startsWith("meta:source:"));
	const source = sourceRow ? sourceRow.name.replace("meta:source:", "") : "";

	const catMap = new Map<number, EmployeeCategory>();

	const getOrCreate = (index: number): EmployeeCategory => {
		if (!catMap.has(index)) {
			catMap.set(index, createEmptyCategory(nextId()));
		}
		return catMap.get(index) as EmployeeCategory;
	};

	for (const row of data) {
		const nameMatch = row.name.match(/^cat:(\d+):name:(.*)$/);
		if (nameMatch) {
			const index = Number.parseInt(nameMatch[1] as string, 10);
			const cat = getOrCreate(index);
			catMap.set(index, { ...cat, name: nameMatch[2] as string });
			continue;
		}

		const detailMatch = row.name.match(/^cat:(\d+):detail:(.*)$/);
		if (detailMatch) {
			const index = Number.parseInt(detailMatch[1] as string, 10);
			const cat = getOrCreate(index);
			catMap.set(index, { ...cat, detail: detailMatch[2] as string });
			continue;
		}

		const match = row.name.match(/^cat:(\d+):(.+)$/);
		if (!match) continue;

		const index = Number.parseInt(match[1] as string, 10);
		const field = match[2] as string;
		const cat = getOrCreate(index);

		switch (field) {
			case "effectif":
				catMap.set(index, {
					...cat,
					womenCount: row.womenCount?.toString() ?? "",
					menCount: row.menCount?.toString() ?? "",
				});
				break;
			case "annual:base":
				catMap.set(index, {
					...cat,
					annualBaseWomen: row.womenValue ?? "",
					annualBaseMen: row.menValue ?? "",
				});
				break;
			case "annual:variable":
				catMap.set(index, {
					...cat,
					annualVariableWomen: row.womenValue ?? "",
					annualVariableMen: row.menValue ?? "",
				});
				break;
			case "hourly:base":
				catMap.set(index, {
					...cat,
					hourlyBaseWomen: row.womenValue ?? "",
					hourlyBaseMen: row.menValue ?? "",
				});
				break;
			case "hourly:variable":
				catMap.set(index, {
					...cat,
					hourlyVariableWomen: row.womenValue ?? "",
					hourlyVariableMen: row.menValue ?? "",
				});
				break;
		}
	}

	const categories = Array.from(catMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([, cat]) => cat);

	return { categories, source };
}
