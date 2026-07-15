"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { TrackedLink } from "~/modules/analytics";
import { useReadOnlyGuard } from "~/modules/auth";
import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { getPostComplianceDestination } from "~/modules/declaration-remuneration/shared/complianceNavigation";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { formatLongDate } from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { FileUpload, useFileUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";
import styles from "./JointEvaluationForm.module.scss";

import { JointEvaluationSubmitModal } from "./JointEvaluationSubmitModal";

const EMPTY_DB_VALUES = {} as Record<string, never>;

type Props = {
	declarationDate: string;
	declarationSiren: string;
	declarationYear: number;
	hasCse: boolean | null;
	jointEvaluationDeadline: Date;
};

export function JointEvaluationForm({
	declarationDate,
	declarationSiren,
	declarationYear,
	hasCse,
	jointEvaluationDeadline,
}: Props) {
	const router = useRouter();
	const readOnlyGuard = useReadOnlyGuard();
	const { isReadOnly } = useLockContext();

	const { clearDraft } = useDeclarationDraft({
		siren: declarationSiren,
		year: declarationYear,
		step: "joint",
		kind: "joint",
		dbValues: EMPTY_DB_VALUES,
	});

	const submitJointEvaluationMutation =
		api.declaration.submitJointEvaluation.useMutation();

	const onAllUploaded = useCallback(() => {
		clearDraft();
		// The upload writes the joint evaluation files to S3; the FSM transition
		// (`joint_evaluation_chosen` / `revised_joint_evaluation_chosen` →
		// `awaiting_cse_opinion` or `demarche_completed`) is decoupled and must
		// be triggered explicitly so the `joint_evaluation_submit` event is
		// recorded and the "Mon espace" panel + table reflect the new step.
		submitJointEvaluationMutation.mutate(undefined, {
			onSettled: () => {
				router.push(getPostComplianceDestination(hasCse));
			},
		});
	}, [clearDraft, hasCse, router, submitJointEvaluationMutation]);

	const {
		closeModal,
		handleConfirm,
		handleFilesChange,
		handleSubmit,
		isPending,
		modalRef,
		selectedFiles,
		uploadError,
	} = useFileUploadForm({
		flowType: "joint_evaluation",
		onAllUploaded,
	});

	return (
		<>
			<form
				autoComplete="off"
				className={common.flexColumnGap2}
				onSubmit={handleSubmit}
			>
				{/* Read-only mode is enforced per control (disabled upload and submit
				    button): a fieldset-level `disabled` would hide the content from
				    some assistive technologies (#3803). */}
				<fieldset className={common.readOnlyFieldset}>
					<legend className="fr-sr-only">
						Évaluation conjointe des rémunérations
					</legend>
					<div className={common.flexBetween}>
						<h1 className="fr-h4 fr-mb-0">
							Parcours de mise en conformité pour l&apos;indicateur par
							catégorie de salariés
						</h1>
					</div>

					<div className={common.flexColumnGapHalf}>
						<h2 className="fr-h5 fr-mb-0">
							Évaluation conjointe des rémunérations
						</h2>
						<p className="fr-mb-0">
							<TrackedLink
								className="fr-link"
								href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
								rel="noopener noreferrer"
								target="_blank"
								trackingId="joint_evaluation"
							>
								En savoir plus sur évaluation conjointe des rémunérations
								<NewTabNotice />
							</TrackedLink>
						</p>
					</div>

					<p className="fr-mb-0">
						Vous devez{" "}
						<strong>
							déposer le rapport de l&apos;évaluation conjointe, ci-dessous.
						</strong>{" "}
						L&apos;accord ou le plan d&apos;action conclu doit être déposé sur
						TéléAccord.
					</p>

					<div className="fr-highlight">
						<p className="fr-mb-1v fr-text--md">Date limite</p>
						<p className="fr-h6 fr-mb-1v">
							{formatLongDate(jointEvaluationDeadline)}
						</p>
						<p className="fr-mb-0 fr-text--sm fr-text--mention-grey">
							Déclaration effectuée le {declarationDate}
						</p>
					</div>

					<div>
						<label className="fr-label" htmlFor="joint-evaluation-file-upload">
							Veuillez importer/déposer le rapport de l&apos;évaluation
							conjointe.
							<span className="fr-hint-text">
								Taille maximale : 10 Mo. Format supporté : pdf.
							</span>
						</label>
					</div>

					<FileUpload
						accept=".pdf"
						acceptLabel="pdf"
						allowedMimeTypes={["application/pdf"]}
						disabled={isReadOnly}
						error={uploadError}
						inputId="joint-evaluation-file-upload"
						onFilesChange={handleFilesChange}
						selectedFiles={selectedFiles}
					/>

					<div>
						<div className={styles.panelBlue}>
							<h3 className="fr-h6">
								Ce que vous devez faire dans un délai de 2 mois
							</h3>
							<ul className="fr-mb-0">
								<li>Élaboration du rapport</li>
								<li>
									Déposez le rapport dans la zone de dépôt prévue sur cette page
								</li>
							</ul>
						</div>
						<div className={styles.panelWhite}>
							<h3 className="fr-h6">Après dépôt du rapport</h3>
							<ul className="fr-mb-2w">
								<li>
									Réaliser l&apos;analyse conjointe et définir des actions
									correctrices
								</li>
								<li>
									Mettre en place l&apos;accord collectif (ou à défaut un plan
									d&apos;action)
								</li>
							</ul>
							<p className="fr-mb-0">
								Les accords conclus devront être déposés sur{" "}
								<a
									className="fr-link"
									href="https://www.teleaccord.travail.gouv.fr"
									rel="noopener noreferrer"
									target="_blank"
								>
									TéléAccord
									<NewTabNotice />
								</a>
							</p>
						</div>
					</div>

					<div className={`fr-mt-4w ${common.flexBetween}`}>
						<Link
							className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
							href="/declaration-remuneration/parcours-conformite"
						>
							Précédent
						</Link>
						<span>
							<button
								{...readOnlyGuard.buttonProps}
								className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
								disabled={isPending || isReadOnly}
								type="submit"
							>
								Transmettre
							</button>
							{readOnlyGuard.tooltip}
						</span>
					</div>
				</fieldset>
			</form>

			<JointEvaluationSubmitModal
				modalRef={modalRef}
				onClose={closeModal}
				onSubmit={handleConfirm}
			/>
		</>
	);
}
