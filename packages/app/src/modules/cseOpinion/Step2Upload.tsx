"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FileUpload, useFileUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";

import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionSummaryBox } from "./components/OpinionSummaryBox";
import { SubmitConfirmationModal } from "./components/SubmitConfirmationModal";
import formStyles from "./shared/formActions.module.scss";

type Props = {
	hasSecondDeclaration?: boolean;
};

export function Step2Upload({ hasSecondDeclaration = true }: Props) {
	const router = useRouter();

	const saveMutation = api.cseOpinion.uploadFile.useMutation({
		onSuccess: () => router.push("/avis-cse/confirmation"),
	});

	const {
		closeModal,
		handleConfirm,
		handleFileChange,
		handleSubmit,
		isPending,
		modalRef,
		selectedFile,
		uploadError,
	} = useFileUploadForm({ saveMutation });

	return (
		<>
			<form onSubmit={handleSubmit}>
				<div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
					<div className="fr-col">
						<h1 className="fr-h4 fr-mb-0">
							Transmettre l&apos;avis ou les avis du CSE
						</h1>
					</div>
				</div>

				<CseStepIndicator currentStep={2} />

				<div>
					<label className="fr-label" htmlFor="cse-file-upload">
						Veuillez importer l&apos;ensemble des avis de votre CSE
						<span className="fr-hint-text">
							Taille maximale : 10 Mo. Format supporté : pdf.
						</span>
					</label>
				</div>

				<FileUpload
					accept=".pdf"
					acceptLabel="pdf"
					allowedMimeTypes={["application/pdf"]}
					error={uploadError}
					inputId="cse-file-upload"
					onFileChange={handleFileChange}
					selectedFile={selectedFile}
				/>

				<div className="fr-mt-4w">
					<OpinionSummaryBox
						firstDeclTitle="Exactitude des données et des méthodes de calcul de la déclaration de l'ensemble des indicateurs"
						secondDeclGapTitle="Justification des écarts ≥ 5 % par des critères objectifs et non sexistes de l'indicateur de rémunération par catégorie de salariés"
						secondDeclTitle="Exactitude des données et des méthodes de calcul de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
						showSecondDeclaration={hasSecondDeclaration}
					/>
				</div>

				<div className={`fr-mt-4w ${formStyles.actions}`}>
					<Link
						className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
						href="/avis-cse/etape/1"
					>
						Précédent
					</Link>
					<button
						className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
						disabled={isPending}
						type="submit"
					>
						Soumettre
					</button>
				</div>
			</form>

			<SubmitConfirmationModal
				modalRef={modalRef}
				onClose={closeModal}
				onSubmit={handleConfirm}
			/>
		</>
	);
}
