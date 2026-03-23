// Domain re-exports (canonical source: ~/modules/domain)
export type { DeclarationStatus, DeclarationType } from "~/modules/domain";

import type { DeclarationStatus, DeclarationType } from "~/modules/domain";

export type CompanyItem = {
	siren: string;
	name: string;
	declarationStatus: DeclarationStatus;
};

export type ViewMode = "list" | "table";

export type CompanyDetail = {
	siren: string;
	name: string;
	address: string | null;
	nafCode: string | null;
	workforce: number | null;
	hasCse: boolean | null;
};

export type DeclarationItem = {
	type: DeclarationType;
	siren: string;
	year: number;
	status: DeclarationStatus;
	currentStep: number;
	updatedAt: Date | null;
};
