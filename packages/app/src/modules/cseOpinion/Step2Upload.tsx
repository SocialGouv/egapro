"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PdfFileUpload, usePdfUploadForm } from "~/modules/shared";

import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionSummaryBox } from "./components/OpinionSummaryBox";
import { SubmitConfirmationModal } from "./components/SubmitConfirmationModal";
import formStyles from "./shared/formActions.module.scss";

export function Step2Upload() {
	const router = useRouter();
	const {
		closeModal,
		handleConfirm,
		handleFileChange,
		handleSubmit,
		modalRef,
		selectedFile,
		uploadError,
	} = usePdfUploadForm({
		onConfirm: () => router.push("/avis-cse/confirmation"),
	});

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

				<div className="fr-mb-3w">
					<p className="fr-text--md fr-text--bold fr-mb-1w">
						Veuillez importer l&apos;ensemble des avis de votre CSE
					</p>
					<p className="fr-text--sm fr-text--mention-grey fr-mb-0">
						Taille maximale : 10 Mo. Format supporté : pdf.
					</p>
				</div>

				<PdfFileUpload
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
