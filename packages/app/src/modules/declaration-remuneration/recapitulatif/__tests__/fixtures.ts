import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";

export function makeCategory(
	overrides: Partial<EmployeeCategoryRow> = {},
): EmployeeCategoryRow {
	return {
		name: "",
		womenCount: null,
		menCount: null,
		annualBaseWomen: null,
		annualBaseMen: null,
		annualVariableWomen: null,
		annualVariableMen: null,
		hourlyBaseWomen: null,
		hourlyBaseMen: null,
		hourlyVariableWomen: null,
		hourlyVariableMen: null,
		...overrides,
	};
}

export const defaultCompany = () => ({
	name: "ACME Corp",
	siren: "123456789",
	nafCode: "6201Z",
	address: "1 rue de Paris, 75001 Paris",
	gipWorkforce: 250,
});

export const emptyStep2Data = () => ({
	indicatorAAnnualWomen: "",
	indicatorAAnnualMen: "",
	indicatorAHourlyWomen: "",
	indicatorAHourlyMen: "",
	indicatorCAnnualWomen: "",
	indicatorCAnnualMen: "",
	indicatorCHourlyWomen: "",
	indicatorCHourlyMen: "",
});

export const emptyStep3Data = () => ({
	indicatorBAnnualWomen: "",
	indicatorBAnnualMen: "",
	indicatorBHourlyWomen: "",
	indicatorBHourlyMen: "",
	indicatorDAnnualWomen: "",
	indicatorDAnnualMen: "",
	indicatorDHourlyWomen: "",
	indicatorDHourlyMen: "",
	indicatorEWomen: "",
	indicatorEMen: "",
});

export const emptyStep4Data = () => ({
	annual: [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
	],
	hourly: [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
	],
});

export const defaultProps = () => ({
	company: defaultCompany(),
	declarationYear: 2025,
	referencePeriod: "01/01/2025 - 31/12/2025",
	declarantName: "Marie Dupont",
	declarantEmail: "marie@acme.fr",
	isCorrection: false,
	totalWomen: 120,
	totalMen: 130,
	step2Data: emptyStep2Data(),
	step3Data: emptyStep3Data(),
	step4Data: emptyStep4Data(),
	step5Categories: [] as EmployeeCategoryRow[],
	step5Source: null as string | null,
});
