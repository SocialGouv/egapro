import { companyLocationRow, formatSiren } from "~/modules/domain";

type Props = {
	company: {
		siren: string;
		name: string;
		address: string | null;
		countryCode: string | null;
		countryLabel: string | null;
		departmentLabel: string | null;
		nafCode: string | null;
		// Exact GIP headcount, `null` when the company is absent from the file of
		// `workforceYear` — rendered as an absence, never as a bracketed tier.
		workforce: number | null;
		workforceYear: number;
		identityUnavailable: boolean;
	};
};

/**
 * Read-only summary of an entreprise, shown before the admin confirms they
 * want to impersonate it.
 */
export function CompanyPreviewCard({ company }: Props) {
	const location = company.identityUnavailable
		? null
		: companyLocationRow({
				countryCode: company.countryCode ?? null,
				countryLabel: company.countryLabel ?? null,
				departmentLabel: company.departmentLabel ?? null,
				domesticAddress: company.address,
			});
	const title = company.identityUnavailable
		? `Entreprise ${formatSiren(company.siren)}`
		: company.name;

	return (
		<div className="fr-card fr-mt-3w">
			<div className="fr-card__body">
				<div className="fr-card__content">
					<h2 className="fr-card__title fr-h3">{title}</h2>
					{company.identityUnavailable && (
						<div className="fr-alert fr-alert--info fr-alert--sm fr-mb-2w">
							<p>
								Les informations d'identification de l'entreprise sont
								temporairement indisponibles.
							</p>
						</div>
					)}
					<div className="fr-card__desc">
						<p>
							<strong>SIREN :</strong> {company.siren}
						</p>
						{location && (
							<p>
								<strong>{location.label} :</strong> {location.value}
							</p>
						)}
						{company.nafCode && (
							<p>
								<strong>Code NAF :</strong> {company.nafCode}
							</p>
						)}
						<p>
							<strong>
								Effectif annuel moyen en {company.workforceYear} :
							</strong>{" "}
							{company.workforce ?? "—"}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
