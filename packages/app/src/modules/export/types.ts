/** Flat row representing one declaration in the export CSV. */
export type ExportRow = {
	// Company
	siren: string;
	companyName: string;
	workforce: number | null;
	nafCode: string | null;
	address: string | null;
	hasCse: boolean | null;

	// Declaration
	year: number;
	status: string | null;
	declarationType: "6_indicateurs" | "7_indicateurs";
	compliancePath: string | null;
	createdAt: string | null;
	updatedAt: string | null;

	// Employees
	totalWomen: number | null;
	totalMen: number | null;

	// Scores (indicators A, B, F, G)
	remunerationScore: number | null;
	variableRemunerationScore: number | null;
	quartileScore: number | null;
	categoryScore: number | null;

	// Second declaration
	secondDeclarationStatus: string | null;
	secondDeclReferencePeriodStart: string | null;
	secondDeclReferencePeriodEnd: string | null;

	// Declarant
	declarantFirstName: string | null;
	declarantLastName: string | null;
	declarantEmail: string;
	declarantPhone: string | null;

	// CSE opinions (up to 4: declarationNumber 1 or 2 × type accuracy or gap)
	cseOpinion1Type: string | null;
	cseOpinion1Opinion: string | null;
	cseOpinion1Date: string | null;
	cseOpinion2Type: string | null;
	cseOpinion2Opinion: string | null;
	cseOpinion2Date: string | null;
	cseOpinion3Type: string | null;
	cseOpinion3Opinion: string | null;
	cseOpinion3Date: string | null;
	cseOpinion4Type: string | null;
	cseOpinion4Opinion: string | null;
	cseOpinion4Date: string | null;
};
