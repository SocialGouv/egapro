import Link from "next/link";

type InfoItemProps = {
	iconClass: string;
	title: string;
	description: string;
};

function HeroInfoItem({ iconClass, title, description }: InfoItemProps) {
	return (
		<div
			style={{
				alignItems: "center",
				display: "flex",
				gap: "2rem",
			}}
		>
			<div
				aria-hidden="true"
				style={{
					alignItems: "center",
					background: "var(--background-default-grey)",
					borderRadius: "50%",
					display: "flex",
					flexShrink: 0,
					height: "4rem",
					justifyContent: "center",
					width: "4rem",
				}}
			>
				<span className={`${iconClass} fr-icon--lg`} />
			</div>
			<div>
				<p className="fr-text--bold fr-mb-0">{title}</p>
				<p className="fr-text--sm fr-mb-0">{description}</p>
			</div>
		</div>
	);
}

/** Hero section of the home page: title, text, CTA button and key indicators. */
export function HomeHero() {
	return (
		<section
			style={{
				background:
					"linear-gradient(-33deg, var(--background-alt-blue-france) 39%, #e7d3ff 113%)",
			}}
		>
			<div className="fr-container fr-py-8w">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className="fr-col-12 fr-col-md-7">
						<h1>Bienvenue sur Egapro</h1>
						<p className="fr-text--lg fr-mb-4w">
							Les entreprises d&apos;au moins 50 salariés ont l&apos;obligation
							de calculer et de publier chaque année leur index de
							l&apos;égalité professionnelle, avant le 1er mars.
						</p>
						<Link
							className="fr-btn fr-icon-draft-fill fr-btn--icon-left"
							href="/index-egapro"
						>
							Déclarer mes indicateurs
						</Link>
					</div>

					<div className="fr-col-12 fr-col-md-5 fr-unhidden-md">
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "2rem",
								padding: "1.5rem",
							}}
						>
							<HeroInfoItem
								description="Plus de 35 000 entreprises déclarantes"
								iconClass="fr-icon-group-fill"
								title="Entreprises de plus de 50 salariés"
							/>
							<HeroInfoItem
								description="Déclaration annuelle obligatoire"
								iconClass="fr-icon-calendar-fill"
								title="Échéance : 1er mars"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
