export type OpinionType = "favorable" | "unfavorable";

export type UploadedFile = {
	id: string;
	fileName: string;
	uploadedAt: Date;
	/** Object size in bytes, or null when it could not be read from storage. */
	fileSize: number | null;
};

export type DeclarationNumber = 1 | 2;

export type ContentType = "accuracy" | "gap";

export type ContentTypeColumn = {
	id: string;
	declarationNumber: DeclarationNumber;
	type: ContentType;
	label: string;
	declarationLabel: string | null;
	description: string;
	missingMessage: string;
};

export type ContentTypeColumnsInput = {
	hasSecondDeclaration: boolean;
	firstDeclGapConsulted: boolean | null;
	secondDeclGapConsulted: boolean | null;
	firstDeclGapHigh: boolean;
	secondDeclGapHigh: boolean;
};

export type ContentTypeKey = {
	declarationNumber: DeclarationNumber;
	type: ContentType;
};

export type FileContentTypeAssociation = {
	declarationNumber: DeclarationNumber;
	type: ContentType;
	fileId: string;
};

export type StoredFileContentType = {
	declarationNumber: number;
	type: string;
	fileId: string;
};

export type AssociationMap = Record<string, string | null>;

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
