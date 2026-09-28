import Link from "next/link";
import { OrdinalLongDate } from "~/modules/declaration-remuneration/shared/OrdinalLongDate";
import { isDeadlinePassed } from "~/modules/domain";
import type { AppHref } from "~/modules/routes";
import styles from "./DeclarationProcessPanel.module.scss";

export type StepStatus = "pending" | "current" | "complete";

type Modification = { href: AppHref; until: Date };

export function TransmittedRow({
	label,
	modification,
	viewHref,
	viewLabel = "Voir le récapitulatif de la déclaration",
}: {
	label: string;
	modification?: Modification;
	viewHref?: AppHref;
	viewLabel?: string;
}) {
	const modificationOpen =
		modification !== undefined && !isDeadlinePassed(modification.until);

	return (
		<div className={styles.transmittedRow}>
			<span aria-hidden="true" className="fr-icon-check-line fr-icon--sm" />
			<div className={styles.transmittedInfo}>
				<p className="fr-mb-0">{label}</p>
				{modification && (
					<p className="fr-text-mention--grey fr-mb-0">
						{modificationOpen
							? "Modifiable jusqu'au "
							: "Modification close depuis le "}
						<OrdinalLongDate date={modification.until} />
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
				{modificationOpen && (
					<a className="fr-btn fr-btn--secondary" href={modification.href}>
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
