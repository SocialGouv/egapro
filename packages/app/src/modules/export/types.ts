/** Flat row representing one declaration in the "Déclarations" sheet. */
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

	// Indicator A — Pay gap (step 2)
	indAAnnualMeanWomen: string | null;
	indAAnnualMeanMen: string | null;
	indAHourlyMeanWomen: string | null;
	indAHourlyMeanMen: string | null;
	indAAnnualMedianWomen: string | null;
	indAAnnualMedianMen: string | null;
	indAHourlyMedianWomen: string | null;
	indAHourlyMedianMen: string | null;

	// Indicator B — Variable pay gap (step 3)
	indBAnnualMeanWomen: string | null;
	indBAnnualMeanMen: string | null;
	indBHourlyMeanWomen: string | null;
	indBHourlyMeanMen: string | null;
	indBAnnualMedianWomen: string | null;
	indBAnnualMedianMen: string | null;
	indBHourlyMedianWomen: string | null;
	indBHourlyMedianMen: string | null;
	indBBeneficiariesWomen: string | null;
	indBBeneficiariesMen: string | null;

	// Indicator F — Quartile distribution (step 4)
	indFAnnualQ1Women: number | null;
	indFAnnualQ1Men: number | null;
	indFAnnualQ1Threshold: string | null;
	indFAnnualQ2Women: number | null;
	indFAnnualQ2Men: number | null;
	indFAnnualQ2Threshold: string | null;
	indFAnnualQ3Women: number | null;
	indFAnnualQ3Men: number | null;
	indFAnnualQ3Threshold: string | null;
	indFAnnualQ4Women: number | null;
	indFAnnualQ4Men: number | null;
	indFAnnualQ4Threshold: string | null;
	indFHourlyQ1Women: number | null;
	indFHourlyQ1Men: number | null;
	indFHourlyQ1Threshold: string | null;
	indFHourlyQ2Women: number | null;
	indFHourlyQ2Men: number | null;
	indFHourlyQ2Threshold: string | null;
	indFHourlyQ3Women: number | null;
	indFHourlyQ3Men: number | null;
	indFHourlyQ3Threshold: string | null;
	indFHourlyQ4Women: number | null;
	indFHourlyQ4Men: number | null;
	indFHourlyQ4Threshold: string | null;

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

/** Row representing one employee category in the "Indicateur G" sheet. */
export type IndicatorGRow = {
	siren: string;
	companyName: string;
	year: number;
	declarationType: "initial" | "correction";
	categoryIndex: number;
	categoryName: string;
	categoryDetail: string | null;
	categorySource: string;
	womenCount: number | null;
	menCount: number | null;
	annualBaseWomen: string | null;
	annualBaseMen: string | null;
	annualVariableWomen: string | null;
	annualVariableMen: string | null;
	hourlyBaseWomen: string | null;
	hourlyBaseMen: string | null;
	hourlyVariableWomen: string | null;
	hourlyVariableMen: string | null;
};
