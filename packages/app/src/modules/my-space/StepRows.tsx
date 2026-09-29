import Link from "next/link";
import type { ReactNode } from "react";
import { OrdinalLongDate } from "~/modules/declaration-remuneration/shared/OrdinalLongDate";
import type { AppHref } from "~/modules/routes";
import styles from "./DeclarationProcessPanel.module.scss";

export type StepStatus = "pending" | "current" | "complete";

type Modification = { href: AppHref };

export function TransmittedRow({
	label,
	mention,
	modification,
	viewHref,
	viewLabel = "Voir le récapitulatif de la déclaration",
}: {
	label: string;
	mention?: string;
	modification?: Modification;
	viewHref?: AppHref;
	viewLabel?: string;
}) {
	return (
		<div className={styles.transmittedRow}>
			<span aria-hidden="true" className="fr-icon-check-line fr-icon--sm" />
			<div className={styles.transmittedInfo}>
				<p className="fr-mb-0">{label}</p>
				{mention && <p className="fr-text-mention--grey fr-mb-0">{mention}</p>}
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
				{modification && (
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

export function BulletList({ children }: { children: ReactNode }) {
	return (
		<ul className={styles.bulletList} role="list">
			{children}
		</ul>
	);
}

export function BulletRow({ children }: { children: ReactNode }) {
	return (
		<li className={styles.bulletItem}>
			<span aria-hidden="true" className={styles.bullet} />
			<p className="fr-mb-0">{children}</p>
		</li>
	);
}
