"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useReadOnlyGuard } from "~/modules/auth";
import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { FormErrors } from "~/modules/declaration-remuneration/shared/FormErrors";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { formatCivilLongDate } from "~/modules/domain";
import { getPostComplianceDestination } from "~/modules/navigation";
import { COMPLIANCE_PATH } from "~/modules/routes";
import { SUBMIT_LABEL, useFileUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";
import {
	JointEvaluationDepositInstructions,
	type JointEvaluationExistingFile,
	JointEvaluationExistingReport,
	JointEvaluationGuidance,
	JointEvaluationHeading,
	JointEvaluationReportUpload,
} from "./JointEvaluationReportBlocks";
import { JointEvaluationSubmitModal } from "./JointEvaluationSubmitModal";

const EMPTY_DB_VALUES = {} as Record<string, never>;

type Props = {
	cseOpinionRequired: boolean;
	declarationDate: string;
	declarationSiren: string;
	declarationYear: number;
	existingFile: JointEvaluationExistingFile | null;
	jointEvaluationDeadline: Date;
};

export function JointEvaluationForm({
	cseOpinionRequired,
	declarationDate,
	declarationSiren,
	declarationYear,
	existingFile,
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
				router.push(getPostComplianceDestination(cseOpinionRequired));
			},
		});
	}, [clearDraft, cseOpinionRequired, router, submitJointEvaluationMutation]);

	const {
		closeModal,
		handleConfirm,
		handleFilesChange,
		handleSubmit,
		hasMissingFile,
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
			<form autoComplete="off" onSubmit={handleSubmit}>
				{/* Read-only mode is enforced per control (disabled upload and submit
				    button): a fieldset-level `disabled` would hide the content from
				    some assistive technologies (#3803). */}
				<fieldset
					className={`${common.readOnlyFieldset} ${common.flexColumnGap2}`}
				>
					<legend className="fr-sr-only">
						Évaluation conjointe des rémunérations
					</legend>
					<div className={common.flexBetween}>
						<h1 className="fr-h4 fr-mb-0">
							Parcours de mise en conformité pour l&apos;indicateur par
							catégorie de salariés
						</h1>
					</div>

					<JointEvaluationHeading title="Dépôt du rapport de l'évaluation conjointe des rémunérations" />

					<JointEvaluationDepositInstructions />

					<div className="fr-highlight">
						<p className="fr-mb-2v fr-text--md">Échéance</p>
						<p className="fr-h6 fr-mb-2v">
							{formatCivilLongDate(jointEvaluationDeadline)}
						</p>
						<p className="fr-mb-0 fr-text--sm fr-text-mention--grey">
							Déclaration effectuée le {declarationDate}
						</p>
					</div>

					{existingFile && (
						<JointEvaluationExistingReport file={existingFile} />
					)}

					<JointEvaluationReportUpload
						disabled={isReadOnly}
						error={uploadError}
						hasMissingFile={hasMissingFile}
						inputId="joint-evaluation-file-upload"
						onFilesChange={handleFilesChange}
						selectedFiles={selectedFiles}
					/>

					<JointEvaluationGuidance todoTitle="Ce que vous devez faire dans un délai de 2 mois" />

					<FormErrors
						mutationError={submitJointEvaluationMutation.error?.message}
					/>

					<div className={common.flexBetween}>
						<Link
							className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
							href={COMPLIANCE_PATH}
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
								{SUBMIT_LABEL}
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
