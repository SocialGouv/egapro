export type OpinionType = "favorable" | "unfavorable";

export type UploadedFile = {
	id: string;
	fileName: string;
	uploadedAt: Date;
};

export type CseOpinionStep1Data = {
	firstDeclAccuracyOpinion: OpinionType | null;
	firstDeclAccuracyDate: string | null;
	firstDeclGapConsulted: boolean | null;
	firstDeclGapOpinion: OpinionType | null;
	firstDeclGapDate: string | null;
	secondDeclAccuracyOpinion: OpinionType | null;
	secondDeclAccuracyDate: string | null;
	secondDeclGapConsulted: boolean | null;
	secondDeclGapOpinion: OpinionType | null;
	secondDeclGapDate: string | null;
};

// Domain re-export (canonical source: ~/modules/domain)
export { MAX_CSE_FILES } from "~/modules/domain";

export const TOTAL_STEPS = 2;

export const STEP_TITLES: Record<number, string> = {
	1: "Renseigner les avis émis par le CSE",
	2: "Importer/Déposer l'avis ou les avis du CSE",
};
