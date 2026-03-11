import type { StepCategoryData } from "../types";

type DbCategory = {
	step: number;
	categoryName: string;
	womenCount: number | null;
	menCount: number | null;
	womenValue: string | null;
	menValue: string | null;
	womenMedianValue: string | null;
	menMedianValue: string | null;
};

export function mapDbCategories(
	categories: DbCategory[],
	step: number,
): StepCategoryData[] {
	return categories
		.filter((c) => c.step === step)
		.map((c) => ({
			name: c.categoryName,
			womenCount: c.womenCount ?? undefined,
			menCount: c.menCount ?? undefined,
			womenValue: c.womenValue ?? undefined,
			menValue: c.menValue ?? undefined,
			womenMedianValue: c.womenMedianValue ?? undefined,
			menMedianValue: c.menMedianValue ?? undefined,
		}));
}
