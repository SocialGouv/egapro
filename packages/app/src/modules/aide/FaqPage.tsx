import { AideBreadcrumb } from "./AideBreadcrumb";
import { AideIllustration } from "./AideIllustration";
import styles from "./AideLayout.module.scss";

type FaqItem = { id: string; question: string; answer: string };
type FaqSubsection = { id: string; title: string; items: FaqItem[] };
type FaqSection = { id: string; title: string; subsections: FaqSubsection[] };

// TODO: Replace placeholder content with real FAQ entries before production release.
const makeItems = (prefix: string, count: number): FaqItem[] =>
	Array.from({ length: count }, (_, i) => ({
		id: `${prefix}-${i + 1}`,
		question: "Intitulé accordéon",
		answer: "Contenu à venir.",
	}));

const FAQ_SECTIONS: FaqSection[] = [
	{
		id: "indicateurs-remuneration",
		title: "Calculez votre indicateur de rémunération",
		subsections: [
			{
				id: "rem-general",
				title: "Sous titre",
				items: makeItems("rem-gen", 4),
			},
			{ id: "rem-detail", title: "Sous titre", items: makeItems("rem-det", 4) },
		],
	},
	{
		id: "indicateurs-representation",
		title: "Calculez votre indicateur de représentation",
		subsections: [
			{
				id: "rep-general",
				title: "Sous titre",
				items: makeItems("rep-gen", 4),
			},
			{ id: "rep-detail", title: "Sous titre", items: makeItems("rep-det", 4) },
		],
	},
];

function AccordionGroup({ items }: { items: FaqItem[] }) {
	return (
		<div className="fr-accordions-group">
			{items.map((item) => (
				<section className="fr-accordion" key={item.id}>
					<h4 className="fr-accordion__title">
						<button
							aria-controls={item.id}
							aria-expanded="false"
							className="fr-accordion__btn"
							type="button"
						>
							{item.question}
						</button>
					</h4>
					<div className="fr-collapse" id={item.id}>
						<p>{item.answer}</p>
					</div>
				</section>
			))}
		</div>
	);
}

/** FAQ page with accordion-based questions grouped by indicator type. */
export function FaqPage() {
	return (
		<main className={styles.pageBackground} id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<AideBreadcrumb
					collapseId="breadcrumb-faq"
					current={{ label: "Questions fréquentes (FAQ)", href: "/aide/faq" }}
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Aide et ressources", href: "/aide" },
					]}
				/>

				<a
					className="fr-link fr-icon-arrow-left-line fr-link--icon-left"
					href="/aide"
				>
					Retour
				</a>

				<h1 className="fr-h1 fr-mt-4w">Questions fréquentes (FAQ)</h1>
				<p className="fr-mb-4w">
					Indicateurs sur l'égalité professionnelle calculs et
					questions/réponses
				</p>

				<div className="fr-grid-row fr-grid-row--gutters">
					<div className="fr-col-12 fr-col-md-3">
						<nav aria-labelledby="fr-summary-title" className="fr-summary">
							<h2 className="fr-summary__title" id="fr-summary-title">
								Sommaire
							</h2>
							<ol>
								{FAQ_SECTIONS.map((section) => (
									<li key={section.id}>
										<a className="fr-summary__link" href={`#${section.id}`}>
											{section.title}
										</a>
									</li>
								))}
							</ol>
						</nav>
					</div>

					<div className="fr-col-12 fr-col-md-9">
						<div className={styles.contentContainer}>
							{FAQ_SECTIONS.map((section) => (
								<div id={section.id} key={section.id}>
									<h2 className="fr-h5">{section.title}</h2>
									{section.subsections.map((sub) => (
										<div className="fr-mt-3w" key={sub.id}>
											<h3 className="fr-h6">{sub.title}</h3>
											<AccordionGroup items={sub.items} />
										</div>
									))}
								</div>
							))}
						</div>
					</div>
				</div>

				<AideIllustration />
			</div>
		</main>
	);
}
