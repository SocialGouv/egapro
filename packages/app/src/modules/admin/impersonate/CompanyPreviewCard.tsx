type Props = {
	company: {
		siren: string;
		name: string;
		address: string | null;
		nafCode: string | null;
		// Exact GIP headcount, `null` when the company is absent from the file of
		// `workforceYear` — rendered as an absence, never as a bracketed tier.
		workforce: number | null;
		workforceYear: number;
	};
};

/**
 * Read-only summary of an entreprise, shown before the admin confirms they
 * want to impersonate it.
 */
export function CompanyPreviewCard({ company }: Props) {
	return (
		<div className="fr-card fr-mt-3w">
			<div className="fr-card__body">
				<div className="fr-card__content">
					<h2 className="fr-card__title fr-h3">{company.name}</h2>
					<div className="fr-card__desc">
						<p>
							<strong>SIREN :</strong> {company.siren}
						</p>
						{company.address && (
							<p>
								<strong>Adresse :</strong> {company.address}
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
