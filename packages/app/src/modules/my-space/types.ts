export type DeclarationStatus = "to_complete" | "in_progress" | "done";

export type CompanyItem = {
	siren: string;
	name: string;
	declarationStatus: DeclarationStatus;
};

export type ViewMode = "list" | "table";
