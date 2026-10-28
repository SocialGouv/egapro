"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useReadOnlyGuard } from "~/modules/auth";
import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { FormErrors } from "~/modules/declaration-remuneration/shared/FormErrors";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { MY_SPACE } from "~/modules/routes";
import { SUBMIT_LABEL, useFileUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";
import {
	JointEvaluationAfterReport,
	type JointEvaluationExistingFile,
	JointEvaluationExistingReport,
	JointEvaluationHeading,
	JointEvaluationReportUpload,
	JointEvaluationTodo,
} from "../jointEvaluation/JointEvaluationReportBlocks";
import { JointEvaluationSubmitModal } from "../jointEvaluation/JointEvaluationSubmitModal";

type Props = {
	existingFile: JointEvaluationExistingFile | null;
};

export function FormalNoticeForm({ existingFile }: Props) {
	const router = useRouter();
	const readOnlyGuard = useReadOnlyGuard();
	const { isReadOnly } = useLockContext();

	const submitMutation = api.formalNotice.submit.useMutation();

	const onAllUploaded = useCallback(() => {
		submitMutation.mutate(undefined, {
			onSuccess: () => {
				router.push(MY_SPACE);
			},
		});
	}, [router, submitMutation]);

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
		flowType: "formal_notice_joint_evaluation",
		onAllUploaded,
	});

	return (
		<>
			<form autoComplete="off" onSubmit={handleSubmit}>
				<fieldset
					className={`${common.readOnlyFieldset} ${common.flexColumnGap2}`}
				>
					<legend className="fr-sr-only">
						Évaluation conjointe des rémunérations
					</legend>
					<h1 className="fr-h4 fr-mb-0">En cas de mise en demeure</h1>

					<JointEvaluationHeading title="Évaluation conjointe des rémunérations" />

					<p className="fr-mb-0 fr-text--bold">
						Le délai de mise en conformité est indiqué dans la mise en demeure
						notifiée par la DREETS.
					</p>

					{existingFile && (
						<JointEvaluationExistingReport file={existingFile} />
					)}

					<JointEvaluationReportUpload
						disabled={isReadOnly}
						error={uploadError}
						hasMissingFile={hasMissingFile}
						inputId="formal-notice-joint-evaluation-file-upload"
						onFilesChange={handleFilesChange}
						selectedFiles={selectedFiles}
					/>

					<div>
						<JointEvaluationTodo title="Ce que vous devez faire" />
						<JointEvaluationAfterReport />
					</div>

					<FormErrors mutationError={submitMutation.error?.message} />

					<div className={common.flexBetween}>
						<Link
							className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
							href={MY_SPACE}
						>
							Précédent
						</Link>
						<span>
							<button
								{...readOnlyGuard.buttonProps}
								className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
								disabled={isPending || submitMutation.isPending || isReadOnly}
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
