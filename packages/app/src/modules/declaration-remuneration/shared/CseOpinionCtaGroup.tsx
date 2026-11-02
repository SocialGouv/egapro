import styles from "./NextStepsBox.module.scss";
import { UpdateCseButton } from "./UpdateCseButton";

type Props = {
	cseApplicable: boolean;
};

export function CseOpinionCtaGroup({ cseApplicable }: Props) {
	return (
		<div className={styles.ctaGroup}>
			<p className="fr-mb-0">
				L&apos;avis du CSE devra être transmis lors de la dernière étape de la
				démarche.
			</p>
			<p className="fr-mb-0">
				Les modèles d&apos;avis du CSE ne sont pas encore disponibles.
			</p>
			{cseApplicable && <UpdateCseButton />}
		</div>
	);
}
