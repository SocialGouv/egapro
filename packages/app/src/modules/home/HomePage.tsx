import Link from "next/link";

/** Page d'accueil — contenu visuel pur, sans provider tRPC. */
export function HomePage() {
	return (
		<main id="content" tabIndex={-1}>
			{/* Hero */}
			<section className="fr-py-8w">
				<div className="fr-container">
					<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
						<div className="fr-col-12 fr-col-md-7">
							<h1>Bienvenue sur Egapro</h1>
							<p className="fr-text--lg">
								Les entreprises d'au moins 50 salariés ont l'obligation de
								calculer et de publier chaque année leur index de l'égalité
								professionnelle, avant le 1er mars.
							</p>
							<p className="fr-text--lg">
								Les entreprises de plus de 1 000 salariés pour le troisième
								exercice fiscal consécutif doivent également publier les écarts
								de représentation femmes-hommes parmi leurs cadres dirigeants et
								membres des instances dirigeantes, avant le 1er mars.
							</p>
						</div>
						<div
							aria-hidden="true"
							className="fr-col-12 fr-col-md-5 fr-unhidden-md"
						>
							<svg
								aria-hidden="true"
								style={{ width: "100%", maxWidth: 480 }}
								viewBox="0 0 800 500"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect fill="#6a6af4" height="150" width="80" x="60" y="300" />
								<rect
									fill="#1212ff"
									height="250"
									opacity="0.8"
									width="80"
									x="200"
									y="200"
								/>
								<rect
									fill="#6a6af4"
									height="200"
									opacity="0.9"
									width="80"
									x="340"
									y="250"
								/>
								<rect
									fill="#1212ff"
									height="300"
									opacity="0.7"
									width="80"
									x="480"
									y="150"
								/>
								<rect
									fill="#6a6af4"
									height="350"
									opacity="0.85"
									width="80"
									x="620"
									y="100"
								/>
								<circle cx="170" cy="80" fill="#161616" r="28" />
								<rect
									fill="#161616"
									height="90"
									rx="8"
									width="44"
									x="148"
									y="108"
								/>
								<circle cx="590" cy="70" fill="#6a6af4" r="28" />
								<rect
									fill="#6a6af4"
									height="90"
									rx="8"
									width="44"
									x="568"
									y="98"
								/>
							</svg>
						</div>
					</div>
				</div>
			</section>

			{/* Cards */}
			<section
				className="fr-py-6w"
				style={{ background: "var(--background-alt-grey)" }}
			>
				<div className="fr-container">
					<div className="fr-grid-row fr-grid-row--gutters">
						<div className="fr-col-12 fr-col-md-6">
							<div className="fr-card fr-card--horizontal fr-enlarge-link">
								<div className="fr-card__body">
									<div className="fr-card__content">
										<h2 className="fr-card__title">
											<Link className="fr-card__link" href="/index-egapro">
												Index de l'égalité professionnelle femmes‑hommes
											</Link>
										</h2>
										<p className="fr-card__desc">
											Calculer et/ou déclarer votre index de l'égalité
											professionnelle entre les femmes et les hommes.
										</p>
									</div>
									<div className="fr-card__footer">
										<ul className="fr-btns-group fr-btns-group--inline-sm">
											<li>
												<Link
													className="fr-btn fr-btn--primary"
													href="/index-egapro"
												>
													Calculer - Déclarer mon Index
												</Link>
											</li>
											<li>
												<Link
													className="fr-btn fr-btn--secondary"
													href="/index-egapro/recherche"
												>
													Consulter l'Index
												</Link>
											</li>
										</ul>
									</div>
								</div>
								<div className="fr-card__header">
									<div className="fr-card__img">
										<span
											aria-hidden="true"
											className="fr-icon fr-icon--lg fr-icon-scales-3-fill"
											style={{
												alignItems: "center",
												display: "flex",
												fontSize: "4rem",
												height: "100%",
												justifyContent: "center",
											}}
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="fr-col-12 fr-col-md-6">
							<div className="fr-card fr-card--horizontal fr-enlarge-link">
								<div className="fr-card__body">
									<div className="fr-card__content">
										<h2 className="fr-card__title">
											<Link
												className="fr-card__link"
												href="/representation-equilibree"
											>
												Représentation équilibrée femmes‑hommes
											</Link>
										</h2>
										<p className="fr-card__desc">
											Déclarer vos écarts de représentation entre les femmes et
											les hommes dans les postes de direction.
										</p>
									</div>
									<div className="fr-card__footer">
										<ul className="fr-btns-group fr-btns-group--inline-sm">
											<li>
												<Link
													className="fr-btn fr-btn--primary"
													href="/representation-equilibree"
												>
													Déclarer mes Écarts
												</Link>
											</li>
											<li>
												<Link
													className="fr-btn fr-btn--secondary"
													href="/representation-equilibree/recherche"
												>
													Consulter les Écarts
												</Link>
											</li>
										</ul>
									</div>
								</div>
								<div className="fr-card__header">
									<div className="fr-card__img">
										<span
											aria-hidden="true"
											className="fr-icon fr-icon--lg fr-icon-group-fill"
											style={{
												alignItems: "center",
												display: "flex",
												fontSize: "4rem",
												height: "100%",
												justifyContent: "center",
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
