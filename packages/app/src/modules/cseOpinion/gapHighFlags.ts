import { hasGapsAboveThreshold } from "~/modules/domain";

type CategoryWithDeclarationType = Parameters<
	typeof hasGapsAboveThreshold
>[0][number] & {
	declarationType: string;
};

export function computeGapHighFlags(
	categories: CategoryWithDeclarationType[],
): { firstDeclGapHigh: boolean; secondDeclGapHigh: boolean } {
	const initialCategories = categories.filter(
		(category) => category.declarationType === "initial",
	);
	const correctionCategories = categories.filter(
		(category) => category.declarationType === "correction",
	);
	return {
		firstDeclGapHigh: hasGapsAboveThreshold(initialCategories),
		secondDeclGapHigh: hasGapsAboveThreshold(correctionCategories),
	};
}
