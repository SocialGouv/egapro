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
				<span
					className={`${iconClass} fr-icon--lg`}
					style={{ color: "var(--artwork-minor-blue-france)" }}
				/>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
				<p
					className="fr-mb-0"
					style={{
						fontSize: "1.25rem",
						fontWeight: 700,
						lineHeight: "1.75rem",
					}}
				>
					{title}
				</p>
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
					<div
						className="fr-col-12 fr-col-md-7"
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "1.5rem",
						}}
					>
						<h1>Bienvenue sur Egapro</h1>
						<p className="fr-mb-0">
							L&apos;espace dédié aux entreprises pour déclarer leurs
							indicateurs de rémunération et de représentation entre les femmes
							et les hommes.
						</p>
						<Link
							className="fr-btn fr-icon-file-text-line fr-btn--icon-left"
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
								iconClass="fr-icon-team-line"
								title="Entreprises de plus de 50 salariés"
							/>
							<HeroInfoItem
								description="Déclaration annuelle obligatoire"
								iconClass="fr-icon-calendar-line"
								title="Échéance : 1er mars"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
