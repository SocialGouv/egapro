import Link from "next/link";
import { OrdinalLongDate } from "~/modules/declaration-remuneration/shared/OrdinalLongDate";
import { isDeadlinePassed } from "~/modules/domain";
import styles from "./DeclarationProcessPanel.module.scss";

export type StepStatus = "pending" | "current" | "complete";

export function TransmittedRow({
	label,
	modifiableUntil,
	modifyHref,
	viewHref,
	viewLabel = "Voir le récapitulatif de la déclaration",
}: {
	label: string;
	modifiableUntil: Date;
	modifyHref?: string;
	viewHref?: string;
	viewLabel?: string;
}) {
	const deadlinePassed = isDeadlinePassed(modifiableUntil);
	const canModify = modifyHref !== undefined && !deadlinePassed;

	return (
		<div className={styles.transmittedRow}>
			<span aria-hidden="true" className="fr-icon-check-line fr-icon--sm" />
			<div className={styles.transmittedInfo}>
				<p className="fr-mb-0">{label}</p>
				{modifyHref && (
					<p className="fr-text-mention--grey fr-mb-0">
						{deadlinePassed
							? "Modification close depuis le "
							: "Modifiable jusqu'au "}
						<OrdinalLongDate date={modifiableUntil} />
					</p>
				)}
			</div>
			<div className={styles.transmittedActions}>
				{viewHref && (
					<Link
						className="fr-btn fr-btn--secondary fr-icon-eye-line"
						href={viewHref}
						title={viewLabel}
					>
						<span className="fr-sr-only">{viewLabel}</span>
					</Link>
				)}
				{canModify && (
					<a className="fr-btn fr-btn--secondary" href={modifyHref}>
						Modifier
					</a>
				)}
			</div>
		</div>
	);
}

export function DeadlineRow({ date }: { date: Date }) {
	return (
		<div className={styles.deadlineRow}>
			<span aria-hidden="true" className="fr-icon-calendar-line fr-icon--sm" />
			<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
				Échéance : <OrdinalLongDate date={date} />
			</p>
		</div>
	);
}
