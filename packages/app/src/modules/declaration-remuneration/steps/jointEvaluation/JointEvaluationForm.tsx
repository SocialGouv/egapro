"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useReadOnlyGuard } from "~/modules/auth";
import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { markJointEvaluationTransmissionSuccess } from "~/modules/declaration-remuneration/shared/declarationSuccessFlash";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { FormErrors } from "~/modules/declaration-remuneration/shared/FormErrors";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import { getPostComplianceDestination } from "~/modules/navigation";
import { SUBMIT_LABEL, useFileUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";
import {
	JointEvaluationAfterReport,
	JointEvaluationDeadline,
	type JointEvaluationExistingFile,
	JointEvaluationExistingReport,
	JointEvaluationHeading,
	JointEvaluationReportUpload,
	JointEvaluationTodo,
} from "./JointEvaluationReportBlocks";
import { JointEvaluationSubmitModal } from "./JointEvaluationSubmitModal";

const EMPTY_DB_VALUES = {} as Record<string, never>;

type Props = {
	cseOpinionRequired: boolean;
	declarationSiren: string;
	declarationYear: number;
	existingFile: JointEvaluationExistingFile | null;
	jointEvaluationDeadline: Date;
	jointEvaluationRound: 1 | 2;
};

export function JointEvaluationForm({
	cseOpinionRequired,
	declarationSiren,
	declarationYear,
	existingFile,
	jointEvaluationDeadline,
	jointEvaluationRound,
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

	const utils = api.useUtils();
	const submitJointEvaluationMutation =
		api.declaration.submitJointEvaluation.useMutation();
	const [uploadedReport, setUploadedReport] =
		useState<JointEvaluationExistingFile | null>(null);
	const storedReport = uploadedReport ?? existingFile;

	const onUploaded = useCallback(
		({ fileId, fileName }: { fileId: string; fileName: string }) => {
			setUploadedReport({ id: fileId, fileName, uploadedAt: new Date() });
		},
		[],
	);

	const redirectIfAlreadyTransmitted = useCallback(async () => {
		try {
			const transmittedRound =
				await utils.jointEvaluation.transmittedRound.fetch(undefined, {
					staleTime: 0,
				});
			if (transmittedRound === jointEvaluationRound) {
				router.push(getPostComplianceDestination(cseOpinionRequired));
			}
		} catch {
			return;
		}
	}, [cseOpinionRequired, jointEvaluationRound, router, utils]);

	const onAllUploaded = useCallback(() => {
		clearDraft();
		// The upload writes the joint evaluation files to S3; the FSM transition
		// (`joint_evaluation_chosen` / `revised_joint_evaluation_chosen` →
		// `awaiting_cse_opinion` or `demarche_completed`) is decoupled and must
		// be triggered explicitly so the `joint_evaluation_submit` event is
		// recorded and the "Mon espace" panel + table reflect the new step.
		submitJointEvaluationMutation.mutate(undefined, {
			onSuccess: () => {
				// Only the CSE-opinion destination consumes this signal; marking it otherwise would leave it stranded in sessionStorage.
				if (cseOpinionRequired) {
					markJointEvaluationTransmissionSuccess();
				}
				router.push(getPostComplianceDestination(cseOpinionRequired));
			},
			// The transition may have committed before the response was lost.
			onError: () => {
				void redirectIfAlreadyTransmitted();
			},
		});
	}, [
		clearDraft,
		cseOpinionRequired,
		redirectIfAlreadyTransmitted,
		router,
		submitJointEvaluationMutation,
	]);

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
		hasStoredFile: storedReport !== null,
		onAllUploaded,
		onUploaded,
	});
	const isSubmitting = isPending || submitJointEvaluationMutation.isPending;

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
						Transmission du rapport de l&apos;évaluation conjointe des
						rémunérations
					</legend>
					<div className={common.flexBetween}>
						<h1 className="fr-h4 fr-mb-0">
							Parcours de mise en conformité pour l&apos;indicateur par
							catégorie d&apos;emplois
						</h1>
						<SavedIndicator hasData={true} />
					</div>

					<JointEvaluationHeading title="Transmission du rapport de l'évaluation conjointe des rémunérations" />

					<JointEvaluationTodo title="Rappel : Ce que vous devez faire dans un délai de 2 mois" />

					{storedReport && (
						<JointEvaluationExistingReport file={storedReport} />
					)}

					<JointEvaluationReportUpload
						beforeDropzone={
							<JointEvaluationDeadline deadline={jointEvaluationDeadline} />
						}
						disabled={isReadOnly}
						error={uploadError}
						hasMissingFile={hasMissingFile}
						inputId="joint-evaluation-file-upload"
						onFilesChange={handleFilesChange}
						selectedFiles={selectedFiles}
					/>

					<JointEvaluationAfterReport />

					<FormErrors
						mutationError={submitJointEvaluationMutation.error?.message}
					/>

					<div className={common.flexBetween}>
						<span />
						<span>
							<button
								{...readOnlyGuard.buttonProps}
								className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
								disabled={isSubmitting || isReadOnly}
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
