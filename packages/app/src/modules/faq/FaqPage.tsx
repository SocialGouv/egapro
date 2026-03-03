import Image from "next/image";
import Link from "next/link";

import { Breadcrumb } from "~/modules/layout";

import { FaqContent } from "./FaqContent";
import styles from "./FaqPage.module.scss";
import { FaqSummary } from "./FaqSummary";
import { FAQ_SECTIONS } from "./faqData";

/** FAQ landing page with sommaire sidebar and accordion content. */
export function FaqPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className={styles.headerZone}>
				<div className="fr-container">
					<Breadcrumb
						items={[
							{ label: "Accueil", href: "/" },
							{ label: "Questions fréquentes (FAQ)" },
						]}
					/>

					<Link
						aria-label="Retour à l'accueil"
						className="fr-link fr-icon-arrow-left-line fr-link--icon-left"
						href="/"
					>
						Retour
					</Link>

					<h1 className="fr-h1 fr-mt-4w">Questions fréquentes (FAQ)</h1>
					<p className="fr-text--lg fr-mb-0">
						Indicateurs sur l'égalité professionnelle : calculs et
						questions/réponses.
					</p>

					<div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
						<div className="fr-col-12 fr-col-md-4">
							<FaqSummary sections={FAQ_SECTIONS} />
						</div>
						<div className="fr-col-12 fr-col-md-8">
							<FaqContent sections={FAQ_SECTIONS} />
						</div>
					</div>
					<div aria-hidden="true" className={styles.illustrationWrapper}>
						<Image
							alt=""
							height={147}
							src="/assets/images/home/help-illustration.svg"
							width={210}
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
