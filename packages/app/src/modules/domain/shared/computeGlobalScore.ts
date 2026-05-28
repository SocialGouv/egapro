export type GlobalScoreInputs = {
	remunerationScore: number | null;
	quartileScore: number | null;
	categoryScore: number | null;
};

export function computeGlobalScore(inputs: GlobalScoreInputs): number | null {
	const { remunerationScore, quartileScore, categoryScore } = inputs;
	if (
		remunerationScore === null ||
		quartileScore === null ||
		categoryScore === null
	) {
		return null;
	}
	return remunerationScore + quartileScore + categoryScore;
}
