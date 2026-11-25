export function companyPlaceholderName(siren: string): string {
	return `Entreprise ${siren}`;
}

type CompanyIdentity = {
	siren: string;
	name: string;
	address?: string | null;
	nafCode?: string | null;
	countryLabel?: string | null;
	departmentLabel?: string | null;
};

// The placeholder name is also persisted for a legal unit the registry knows
// but cannot name, so the name alone does not tell an outage from a nameless
// unit. Nothing persisted at all is the fingerprint of a lookup that never
// answered: a registry response always carries a name, an address, a NAF code
// or a country.
export function isCompanyIdentityUnresolved(company: CompanyIdentity): boolean {
	return (
		company.name === companyPlaceholderName(company.siren) &&
		!company.address &&
		!company.nafCode &&
		!company.countryLabel &&
		!company.departmentLabel
	);
}
