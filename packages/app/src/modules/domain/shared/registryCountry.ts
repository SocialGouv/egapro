export type RegistryCountry = {
	countryCode: string | null;
	countryLabel: string | null;
};

const COUNTRY_CODE_MAX_LENGTH = 5;
const COUNTRY_LABEL_MAX_LENGTH = 255;

export const FRANCE_COUNTRY: RegistryCountry = Object.freeze({
	countryCode: null,
	countryLabel: "FRANCE",
});

export const UNKNOWN_COUNTRY: RegistryCountry = Object.freeze({
	countryCode: null,
	countryLabel: null,
});

type RegistryEstablishment = {
	codepaysetrangeretablissement?: unknown;
	libellepaysetrangeretablissement?: unknown;
};

export function isUnknownCountry(country: {
	countryLabel?: string | null;
}): boolean {
	return country.countryLabel === null || country.countryLabel === undefined;
}

function toForeignCountry(
	code: string | null,
	label: string | null,
): RegistryCountry | null {
	if (!code || !label) return null;
	if (code.length > COUNTRY_CODE_MAX_LENGTH) return null;
	return {
		countryCode: code,
		countryLabel: label.slice(0, COUNTRY_LABEL_MAX_LENGTH),
	};
}

export function legalUnitCountry({
	postalCode,
	declaredCode,
	declaredLabel,
}: {
	postalCode: string | null;
	declaredCode: string | null;
	declaredLabel: string | null;
}): RegistryCountry | null {
	const declared = toForeignCountry(declaredCode, declaredLabel);
	if (declared) return declared;
	if (declaredCode || declaredLabel) return UNKNOWN_COUNTRY;
	if (postalCode) return FRANCE_COUNTRY;
	return null;
}

function readEstablishment(payload: unknown): RegistryEstablishment | null {
	if (!payload || typeof payload !== "object") return null;
	const content: unknown = (payload as { content?: unknown }).content;
	if (Array.isArray(content)) {
		const first: unknown = content[0];
		return first && typeof first === "object"
			? (first as RegistryEstablishment)
			: null;
	}
	return payload as RegistryEstablishment;
}

function asText(value: unknown): string | null {
	return typeof value === "string" ? value : null;
}

export function headOfficeCountry(payload: unknown): RegistryCountry {
	const establishment = readEstablishment(payload);
	return (
		toForeignCountry(
			asText(establishment?.codepaysetrangeretablissement),
			asText(establishment?.libellepaysetrangeretablissement),
		) ?? UNKNOWN_COUNTRY
	);
}
