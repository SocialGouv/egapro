import { formatWorkforceDisplay } from "~/modules/domain";

type Props = {
	company: {
		siren: string;
		name: string;
		address: string | null;
		nafCode: string | null;
		workforce: number | null;
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
						{/* The row stays hidden when the registry has no headcount: here
						    a missing value means "unknown", not "voluntary tier", so it
						    must not borrow the bracket label (issue 3914). */}
						{company.workforce !== null && (
							<p>
								<strong>Effectif :</strong>{" "}
								{formatWorkforceDisplay(company.workforce)}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
