import Image from "next/image";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import styles from "./FeedbackBanner.module.scss";

const FEEDBACK_URL =
	"https://jedonnemonavis.numerique.gouv.fr/Demarches/4169?button=4730";

type Props = {
	className?: string;
};

export function FeedbackBanner({ className }: Props) {
	return (
		<div
			className={className ? `${styles.banner} ${className}` : styles.banner}
		>
			<div className={styles.content}>
				<h2 className="fr-text--xl fr-text--bold fr-mb-1w">
					Comment s&apos;est passée votre démarche ?
				</h2>
				<p className="fr-text--sm fr-mb-0">
					Aidez nous à améliorer Egapro en donnant votre avis, cela ne prend que
					2 minutes.
				</p>
			</div>
			<a href={FEEDBACK_URL} rel="noopener noreferrer" target="_blank">
				<Image
					alt="Je donne mon avis"
					height={85}
					src="/assets/images/je-donne-mon-avis.svg"
					width={200}
				/>
				<NewTabNotice />
			</a>
		</div>
	);
}
