import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "~/modules/layout/Breadcrumb";
import { getPublicDeclarationsBySiren } from "~/modules/public-api";
import { HistoryChart } from "./HistoryChart";
import { IndicatorTables } from "./IndicatorTables";

type Props = { siren: string; selectedYear?: number };

export async function CompanyConsultationPage({ siren, selectedYear }: Props) {
	const declarations = await getPublicDeclarationsBySiren(siren, 50);
	if (declarations.length === 0) notFound();
	const current =
		declarations.find((item) => item.year === selectedYear) ?? declarations[0];
	if (!current) notFound();
	const location = current.countryLabel
		? `Pays : ${current.countryLabel}`
		: [
				current.city,
				current.region,
				current.departmentCode,
				current.departmentLabel,
			]
				.filter(Boolean)
				.join(" — ");
	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<Breadcrumb
				items={[
					{ label: "Accueil", href: "/" },
					{ label: "Consulter les résultats", href: "/index-egapro/recherche" },
					{ label: current.name ?? `Entreprise ${siren}` },
				]}
			/>
			<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-mt-4w">
				<div className="fr-col-12 fr-col-lg-8">
					<h1 className="fr-h1 fr-mb-2w">{current.name ?? "Entreprise"}</h1>
					<p className="fr-text--lead fr-mb-2w">SIREN {current.siren}</p>
					<ul className="fr-raw-list">
						{location && <li>{location}</li>}
						{current.nafCode && (
							<li>
								Activité : {current.nafCode}
								{current.nafLabel ? ` — ${current.nafLabel}` : ""}
							</li>
						)}
						{current.workforceEma !== null && (
							<li>
								Effectif annuel moyen :{" "}
								{Math.round(current.workforceEma).toLocaleString("fr-FR")}
							</li>
						)}
					</ul>
				</div>
				<div className="fr-col-12 fr-col-lg-4">
					<a
						className="fr-link fr-icon-external-link-line fr-link--icon-right"
						href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${current.siren}`}
						rel="noreferrer"
						target="_blank"
					>
						Voir sur l’Annuaire des Entreprises{" "}
						<span className="fr-sr-only">— nouvelle fenêtre</span>
					</a>
				</div>
			</div>

			<nav aria-label="Choisir l’année de résultats" className="fr-mt-5w">
				<ul className="fr-tags-group">
					{declarations.map((item) => (
						<li key={item.year}>
							<Link
								aria-current={item.year === current.year ? "page" : undefined}
								className="fr-tag"
								href={`/index-egapro/entreprise/${siren}?year=${item.year}`}
							>
								{item.year}
							</Link>
						</li>
					))}
				</ul>
			</nav>

			<section aria-labelledby="indicators-title" className="fr-mt-6w">
				<h2 id="indicators-title">
					Résultats des six indicateurs en {current.year}
				</h2>
				<IndicatorTables declaration={current} />
			</section>

			{declarations.length > 1 && (
				<section aria-labelledby="history-title" className="fr-mt-7w">
					<h2 id="history-title">Évolution historique</h2>
					<p>
						Les écarts positifs indiquent une rémunération moyenne plus élevée
						pour les hommes; les écarts négatifs, une rémunération plus élevée
						pour les femmes.
					</p>
					<HistoryChart declarations={declarations} />
					<div className="fr-table fr-table--multiline">
						<div className="fr-table__wrapper">
							<div className="fr-table__container">
								<div className="fr-table__content">
									<table>
										<caption>
											Alternative tabulaire au graphique d’évolution
										</caption>
										<thead>
											<tr>
												<th scope="col">Année</th>
												<th scope="col">Rémunération annuelle moyenne</th>
												<th scope="col">Taux horaire moyen</th>
												<th scope="col">Variable annuelle</th>
											</tr>
										</thead>
										<tbody>
											{declarations.map((item) => (
												<tr key={item.year}>
													<th scope="row">{item.year}</th>
													<td>
														{item.globalAnnualMeanGap === null
															? "—"
															: `${(item.globalAnnualMeanGap * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`}
													</td>
													<td>
														{item.globalHourlyMeanGap === null
															? "—"
															: `${(item.globalHourlyMeanGap * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`}
													</td>
													<td>
														{item.variableAnnualMeanGap === null
															? "—"
															: `${(item.variableAnnualMeanGap * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</section>
			)}

			<section aria-labelledby="downloads-title" className="fr-mt-7w">
				<h2 id="downloads-title">Télécharger et réutiliser ces données</h2>
				<ul className="fr-btns-group fr-btns-group--inline-sm">
					<li>
						<a
							className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
							href={`/api/public/declarations/export?format=xlsx&q=${current.siren}`}
						>
							Excel
						</a>
					</li>
					<li>
						<a
							className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
							href={`/api/public/declarations/export?format=csv&q=${current.siren}`}
						>
							CSV
						</a>
					</li>
					<li>
						<a
							className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
							href={`/api/public/declarations/export?format=json&q=${current.siren}`}
						>
							JSON
						</a>
					</li>
				</ul>
			</section>

			<div className="fr-callout fr-icon-information-line fr-mt-7w">
				<h2 className="fr-callout__title">À propos de ces résultats</h2>
				<p className="fr-callout__text">
					Données issues des déclarations EgaPro et des calculs GIP-MDS.
					L’indicateur G, les données des déclarants et les avis CSE sont
					confidentiels et ne figurent jamais dans cette consultation.
				</p>
			</div>
		</main>
	);
}
