"use client";

import { getReferenceYearFor, isDeclarationSubmitted } from "~/modules/domain";
import { DownloadStatusRegion, useDownloadClickGuard } from "~/modules/shared";
import styles from "./DeclarationProcessPanel.module.scss";
import type { DeclarationItem } from "./types";

const PENDING_LABEL = "Téléchargement en cours…";

export function getDocumentsPanelId(declaration: DeclarationItem): string {
	return `documents-panel-${declaration.type}-${declaration.year}`;
}

type DocumentResource = {
	title: string;
	subtitle: string;
	href: string;
};

function resourceSubtitle(declaration: DeclarationItem): string {
	return `Année ${declaration.year} au titre des données ${getReferenceYearFor(declaration.year)}`;
}

function getRepresentationResources(
	declaration: DeclarationItem,
): DocumentResource[] {
	if (declaration.status !== "done" || declaration.notSubject) return [];
	const referenceYear = getReferenceYearFor(declaration.year);
	return [
		{
			title: "Télécharger le récapitulatif de la déclaration",
			subtitle: resourceSubtitle(declaration),
			href: `/api/representation-pdf?year=${referenceYear}`,
		},
	];
}

function getRemunerationResources(
	declaration: DeclarationItem,
): DocumentResource[] {
	const resources: DocumentResource[] = [];
	const subtitle = resourceSubtitle(declaration);

	if (declaration.hasPrefillData) {
		resources.push({
			title: "Télécharger les données préremplies (issues des données DSN)",
			subtitle,
			href: `/api/prefill-pdf?year=${declaration.year}`,
		});
	}

	if (isDeclarationSubmitted(declaration.fsmStatus)) {
		resources.push({
			title: "Télécharger le récapitulatif de la déclaration des indicateurs",
			subtitle,
			href: `/api/declaration-pdf?year=${declaration.year}`,
		});
	}

	if (declaration.hasSubmittedSecondDeclaration) {
		resources.push({
			title: "Télécharger le récapitulatif de la seconde déclaration",
			subtitle,
			href: `/api/declaration-pdf?type=correction&year=${declaration.year}`,
		});
	}

	if (
		declaration.hasSubmittedCseOpinion ||
		declaration.hasJointEvaluationFile
	) {
		resources.push({
			title: "Télécharger le récapitulatif des éléments transmis",
			subtitle,
			href: `/api/transmitted-pdf?year=${declaration.year}`,
		});
	}

	return resources;
}

function getResources(declaration: DeclarationItem): DocumentResource[] {
	if (declaration.type === "representation") {
		return getRepresentationResources(declaration);
	}
	if (declaration.type === "remuneration") {
		return getRemunerationResources(declaration);
	}
	return [];
}

export function getDocumentResourceCount(declaration: DeclarationItem): number {
	return getResources(declaration).length;
}

type DocumentCardItemProps = {
	resource: DocumentResource;
};

function DocumentCardItem({ resource }: DocumentCardItemProps) {
	const { anchorProps, state } = useDownloadClickGuard(resource.href);

	return (
		<li className={styles.documentItem}>
			<div className="fr-card fr-card--sm fr-card--download fr-enlarge-link">
				<div className="fr-card__body">
					<div className="fr-card__content">
						<h3 className="fr-card__title">
							<a {...anchorProps}>{resource.title}</a>
						</h3>
						<p className="fr-card__desc">{resource.subtitle}</p>
						<div className="fr-card__end">
							<p className="fr-card__detail">
								{state === "pending" ? PENDING_LABEL : "PDF"}
							</p>
						</div>
					</div>
				</div>
			</div>
			<DownloadStatusRegion pendingLabel={PENDING_LABEL} state={state} />
		</li>
	);
}

type Props = {
	declaration: DeclarationItem;
};

export function DocumentsPanel({ declaration }: Props) {
	const panelId = getDocumentsPanelId(declaration);
	const titleId = `${panelId}-title`;
	const resources = getResources(declaration);
	const title =
		declaration.type === "remuneration"
			? `Démarche des indicateurs de rémunération ${declaration.year}`
			: `Démarche de représentation ${declaration.year}`;

	return (
		<dialog
			aria-labelledby={titleId}
			aria-modal="true"
			className={`fr-modal ${styles.sidePanel}`}
			id={panelId}
		>
			<div className={styles.panelContainer}>
				<div className={styles.panelHeader}>
					<button
						aria-controls={panelId}
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-right fr-icon-close-line"
						title="Fermer"
						type="button"
					>
						Fermer
					</button>
				</div>
				<div className={styles.panelContent}>
					<div>
						<h2 className="fr-h5 fr-mb-3w" id={titleId}>
							{title}
						</h2>
						<ul className={styles.documentList}>
							{resources.map((resource) => (
								<DocumentCardItem key={resource.href} resource={resource} />
							))}
						</ul>
					</div>
				</div>
			</div>
		</dialog>
	);
}
