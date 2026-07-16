import { Breadcrumb } from "~/modules/layout";
import { HistoryListSection } from "./HistoryListSection";

type Props = {
	siren: string;
	year: number;
};

export function DeclarationHistoryPage({ siren, year }: Props) {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-4w">
				<Breadcrumb
					items={[
						{ label: "Mon espace", href: "/mon-espace" },
						{ label: "Historique des actions" },
					]}
				/>
				<h1 className="fr-h1 fr-mt-3w">Historique des modifications</h1>
				<p className="fr-text--lg fr-mb-4w">
					Démarche des indicateurs de rémunération {year}
				</p>
				<HistoryListSection siren={siren} year={year} />
			</div>
		</main>
	);
}
