import type { PublicRepresentationDTO } from "~/modules/public-api";

/** A complete representation declaration, computable on both indicators. */
export function representationFixture(
	overrides: Partial<PublicRepresentationDTO> = {},
): PublicRepresentationDTO {
	return {
		siren: "998900001",
		year: 2027,
		name: "Alpha Solutions",
		address: "12 rue des Innovateurs, 75011 Paris, France",
		region: "Île-de-France",
		departmentCode: "75",
		departmentLabel: "Paris",
		nafCode: "62.02A",
		nafLabel: "Conseil en systèmes et logiciels informatiques",
		referencePeriodStart: "2026-01-01",
		referencePeriodEnd: "2026-12-31",
		executiveWomenPercent: 25,
		executiveMenPercent: 75,
		notComputableReasonExecutives: null,
		memberWomenPercent: 25,
		memberMenPercent: 75,
		notComputableReasonMembers: null,
		publishDate: "2027-03-01",
		publishUrl: null,
		publishModalities: null,
		...overrides,
	};
}
