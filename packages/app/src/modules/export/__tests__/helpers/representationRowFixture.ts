import type { RepresentationRow } from "~/modules/export";

export function makeRepresentationRow(
	overrides: Partial<RepresentationRow> = {},
): RepresentationRow {
	return {
		id: "repr-1",
		siren: "123456789",
		year: 2027,
		referencePeriodStart: "2027-01-01",
		referencePeriodEnd: "2027-12-31",
		executiveWomenPercent: "40.00",
		executiveMenPercent: "60.00",
		notComputableReasonExecutives: null,
		memberWomenPercent: "45.50",
		memberMenPercent: "54.50",
		notComputableReasonMembers: null,
		publishDate: "2028-03-01",
		publishUrl: "https://example.fr/representation",
		publishModalities: "Site internet",
		submittedAt: new Date("2027-03-15T10:00:00Z"),
		companyName: "Entreprise Test",
		address: "1 rue de la Paix, 75002 Paris",
		nafCode: "62.02A",
		region: "Île-de-France",
		departmentLabel: "Paris",
		...overrides,
	};
}
