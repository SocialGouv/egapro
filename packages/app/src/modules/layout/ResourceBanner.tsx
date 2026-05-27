import Image from "next/image";
import Link from "next/link";

import styles from "./ResourceBanner.module.scss";
import { DsfrPictogram } from "./shared/DsfrPictogram";

type ResourceTileProps = {
	href: string;
	pictogramPath: string;
	title: string;
	detail: string;
};

function ResourceTile({
	href,
	pictogramPath,
	title,
	detail,
}: ResourceTileProps) {
	return (
		<div className="fr-tile fr-tile--horizontal fr-tile--sm fr-enlarge-link">
			<div className="fr-tile__body">
				<div className={`fr-tile__content ${styles.tileContent}`}>
					<h3 className="fr-tile__title">
						<Link href={href}>{title}</Link>
					</h3>
					<p className="fr-tile__detail">{detail}</p>
				</div>
			</div>
			<div className="fr-tile__header">
				<div className="fr-tile__pictogram">
					<DsfrPictogram path={pictogramPath} />
				</div>
			</div>
		</div>
	);
}

/** Global resource banner with links to FAQ, reference texts and contact. */
export function ResourceBanner() {
	return (
		<section
			aria-label="Ressources et aide"
			className="fr-background-alt--blue-france fr-py-7w"
		>
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className="fr-col-12 fr-col-md-10">
						<div className="fr-grid-row fr-grid-row--gutters">
							<div className="fr-col-12 fr-col-md-4">
								<ResourceTile
									detail="Recherchez et accédez à toutes nos ressources"
									href="/aide"
									pictogramPath="/dsfr/artwork/pictograms/document/document-search.svg"
									title="Centre d'aide"
								/>
							</div>
							<div className="fr-col-12 fr-col-md-4">
								<ResourceTile
									detail="Réponses aux questions les plus courantes"
									href="/faq"
									pictogramPath="/dsfr/artwork/pictograms/system/information.svg"
									title="Questions fréquentes (FAQ)"
								/>
							</div>
							<div className="fr-col-12 fr-col-md-4">
								<ResourceTile
									detail="Besoin d'aide ? Contactez nos services d'assistance"
									href="/aide/nous-contacter"
									pictogramPath="/dsfr/artwork/pictograms/digital/avatar.svg"
									title="Nous contacter"
								/>
							</div>
						</div>
					</div>
					<div
						aria-hidden="true"
						className="fr-col-12 fr-col-md-2 fr-hidden fr-unhidden-md"
					>
						<div className="fr-grid-row fr-grid-row--right">
							<Image
								alt=""
								height={147}
								src="/assets/images/home/help-illustration.svg"
								unoptimized
								width={210}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
