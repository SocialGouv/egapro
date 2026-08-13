"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import {
	formatPercentage,
	formatShortDate,
	getRepresentationCampaignYear,
} from "~/modules/domain";
import { useDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";
import { SubmitModal } from "../SubmitModal";
import { ComplianceBadge } from "../shared/ComplianceBadge";
import { useRepresentationDraftContext } from "../shared/draft/DraftContext";
import type { RepresentationIndicatorSummary } from "../shared/reviewSummary";
import {
	buildRepresentationSubmitPayload,
	describeNonCompliance,
	summarizeRepresentationReview,
} from "../shared/reviewSummary";
import { Step5NextSteps } from "./Step5NextSteps";
import styles from "./Step5Review.module.scss";

const CONFIRMATION_HREF = "/declaration-representation/confirmation";

function formatIsoDate(value: string | undefined): string {
	return value === undefined ? "—" : formatShortDate(new Date(value));
}

function IndicatorCard({
	indicator,
}: {
	indicator: RepresentationIndicatorSummary;
}) {
	return (
		<div className={styles.card}>
			<h3 className="fr-text--sm fr-text--bold fr-mb-0">{indicator.title}</h3>

			{indicator.notComputableReason === null ? (
				<div className={styles.percentages}>
					<div className={styles.percentage}>
						<p className="fr-text--sm fr-mb-0">Femmes</p>
						<p className="fr-text--sm fr-text--bold fr-mb-0">
							{formatPercentage(indicator.womenPercent)}
						</p>
					</div>
					<div className={styles.percentage}>
						<p className="fr-text--sm fr-mb-0">Hommes</p>
						<p className="fr-text--sm fr-text--bold fr-mb-0">
							{formatPercentage(indicator.menPercent)}
						</p>
					</div>
				</div>
			) : (
				<p className="fr-text--sm fr-mb-0">{indicator.notComputableReason}</p>
			)}

			<div className={styles.badgeRow}>
				<ComplianceBadge verdict={indicator.verdict} />
			</div>
		</div>
	);
}

export function Step5Review() {
	const { draft, year, isReadOnly, previousHref } =
		useRepresentationDraftContext();
	const router = useRouter();
	const { modalRef, open, close } = useDsfrModal();

	const campaignYear = getRepresentationCampaignYear(year);
	const summary = useMemo(
		() => summarizeRepresentationReview(draft, campaignYear),
		[draft, campaignYear],
	);
	const nonComplianceSentence = describeNonCompliance(
		summary.nonCompliantIndicators,
	);

	const submitMutation = api.representationDeclaration.submit.useMutation({
		onSuccess: () => {
			close();
			router.push(CONFIRMATION_HREF);
		},
	});

	const handleConfirm = useCallback(() => {
		if (submitMutation.isPending) return;
		submitMutation.mutate({
			year,
			payload: buildRepresentationSubmitPayload(draft),
		});
	}, [draft, submitMutation, year]);

	return (
		<div className={styles.review}>
			<p className="fr-text--md fr-mb-0">
				Vérifiez les informations avant de soumettre votre déclaration aux
				services du ministère chargé du travail.
			</p>

			<section className={styles.section}>
				<h2 className="fr-text--lg fr-text--bold fr-mb-0">
					Période de référence
				</h2>
				<dl className={`fr-text--md ${styles.definitionList}`}>
					<dt>Année de référence</dt>
					<dd>{year}</dd>
					<dt>Période de référence</dt>
					<dd>
						{formatIsoDate(draft.referencePeriodStart)} -{" "}
						{formatIsoDate(draft.referencePeriodEnd)}
					</dd>
				</dl>
			</section>

			<section className={styles.section}>
				<h2 className="fr-text--lg fr-text--bold fr-mb-0">
					Écarts de représentation
				</h2>
				<div className={styles.cards}>
					{summary.indicators.map((indicator) => (
						<IndicatorCard indicator={indicator} key={indicator.key} />
					))}
				</div>
			</section>

			{summary.publicationApplicable ? (
				<section className={styles.section}>
					<h2 className="fr-text--lg fr-text--bold fr-mb-0">Publication</h2>
					<dl className={`fr-text--md ${styles.definitionList}`}>
						<dt>Date de publication</dt>
						<dd>{formatIsoDate(draft.publishDate)}</dd>
						<dt>Site Internet de publication</dt>
						<dd>{draft.hasWebsite === true ? "Oui" : "Non"}</dd>
						{draft.hasWebsite === true ? (
							<>
								<dt>Adresse de la page (URL)</dt>
								<dd>{draft.publishUrl ?? "—"}</dd>
							</>
						) : (
							<>
								<dt>Modalités de communication</dt>
								<dd>{draft.publishModalities ?? "—"}</dd>
							</>
						)}
					</dl>
				</section>
			) : null}

			{nonComplianceSentence === null ? null : (
				<Step5NextSteps summary={nonComplianceSentence} />
			)}

			{submitMutation.error ? (
				<div className="fr-alert fr-alert--error fr-alert--sm" role="alert">
					<p>{submitMutation.error.message}</p>
				</div>
			) : null}

			<div className={styles.actions}>
				<Link
					className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
					href={previousHref}
				>
					Précédent
				</Link>
				{isReadOnly ? null : (
					<button
						className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
						onClick={open}
						type="button"
					>
						Soumettre
					</button>
				)}
			</div>

			{isReadOnly ? null : (
				<SubmitModal
					campaignYear={campaignYear}
					isPending={submitMutation.isPending}
					modalRef={modalRef}
					onClose={close}
					onSubmit={handleConfirm}
					variant={summary.submitVariant}
				/>
			)}
		</div>
	);
}
