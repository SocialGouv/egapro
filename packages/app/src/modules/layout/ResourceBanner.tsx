import Image from "next/image";
import Link from "next/link";

import { DsfrPictogram } from "~/modules/home";

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
				<div className="fr-tile__content">
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
				<div className="fr-grid-row fr-grid-row--gutters">
					<div className="fr-col-12 fr-col-md">
						<ResourceTile
							detail="Réponses aux questions les plus courantes"
							href="/faq"
							pictogramPath="/dsfr/artwork/pictograms/system/information.svg"
							title="Questions fréquentes (FAQ)"
						/>
					</div>
					<div className="fr-col-12 fr-col-md">
						<ResourceTile
							detail="Consultez les textes législatifs et réglementaires"
							href="/textes-reference"
							pictogramPath="/dsfr/artwork/pictograms/document/document.svg"
							title="Textes de référence"
						/>
					</div>
					<div className="fr-col-12 fr-col-md">
						<ResourceTile
							detail="Besoin d'aide ? Contactez nos services d'assistance"
							href="/aide/nous-contacter"
							pictogramPath="/dsfr/artwork/pictograms/digital/avatar.svg"
							title="Nous contacter"
						/>
					</div>
					<div
						aria-hidden="true"
						className="fr-col-md-2 fr-hidden fr-unhidden-md"
					>
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
		</section>
	);
}
