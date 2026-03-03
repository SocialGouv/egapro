import Image from "next/image";

export function ArchivesSection() {
	return (
		<div className="fr-container fr-mb-6w">
			<div className="fr-card fr-card--grey fr-card--no-border fr-p-3w">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className="fr-col-auto">
						<Image
							alt=""
							aria-hidden="true"
							className="fr-artwork"
							height={80}
							src="/dsfr/artwork/pictograms/document/archive.svg"
							unoptimized
							width={80}
						/>
					</div>
					<div className="fr-col">
						<p className="fr-text--bold fr-mb-1v">Archives</p>
						<p className="fr-text--sm fr-mb-0">
							Récupérer vos anciennes déclarations de l'index de l'égalité
							professionnelle femmes-hommes.
						</p>
					</div>
					<div className="fr-col-auto">
						<button
							className="fr-btn fr-btn--tertiary"
							disabled
							title="Fonctionnalité à venir"
							type="button"
						>
							Demander une déclaration archivée
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
