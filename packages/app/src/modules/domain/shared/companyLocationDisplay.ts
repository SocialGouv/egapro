export const COUNTRY_ROW_LABEL = "Pays";
export const ADDRESS_ROW_LABEL = "Adresse";
export const UNKNOWN_COUNTRY_VALUE = "inconnu";

// Kept lowercase unless they open the string — INSEE/Weez text (address, country label…) comes fully uppercased.
const LOWERCASE_WORDS = new Set([
	"de",
	"du",
	"des",
	"la",
	"le",
	"les",
	"et",
	"en",
	"aux",
	"sur",
	"sous",
	"d",
	"l",
]);

export function formatInseeTitleCase(text: string): string {
	return text
		.toLocaleLowerCase("fr-FR")
		.replace(/\p{L}+/gu, (word, offset: number) => {
			if (offset > 0 && LOWERCASE_WORDS.has(word)) return word;
			return (word[0]?.toLocaleUpperCase("fr-FR") ?? "") + word.slice(1);
		});
}

export type CompanyLocationRow = { label: string; value: string };

type CompanyLocationInput = {
	countryCode: string | null;
	countryLabel: string | null;
	departmentLabel: string | null;
	domesticAddress: string | null;
};

export function companyLocationRow({
	countryCode,
	countryLabel,
	departmentLabel,
	domesticAddress,
}: CompanyLocationInput): CompanyLocationRow | null {
	if (countryCode !== null && countryLabel !== null) {
		return {
			label: COUNTRY_ROW_LABEL,
			value: formatInseeTitleCase(countryLabel),
		};
	}
	const isDomestic =
		countryCode === null && (countryLabel !== null || departmentLabel !== null);
	if (!isDomestic) {
		return { label: COUNTRY_ROW_LABEL, value: UNKNOWN_COUNTRY_VALUE };
	}
	return domesticAddress
		? { label: ADDRESS_ROW_LABEL, value: domesticAddress }
		: null;
}
