"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { getPostComplianceDestination } from "~/modules/declaration-remuneration/shared/complianceNavigation";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { PdfFileUpload, uploadPdf, usePdfUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";

import { JointEvaluationSubmitModal } from "./JointEvaluationSubmitModal";

type Props = {
	currentYear: number;
	declarationDate: string;
	hasCse: boolean | null;
};

export function JointEvaluationForm({
	currentYear,
	declarationDate,
	hasCse,
}: Props) {
	const router = useRouter();
	const [isUploading, setIsUploading] = useState(false);

	const saveMutation = api.jointEvaluation.uploadFile.useMutation({
		onSuccess: () => router.push(getPostComplianceDestination(hasCse)),
	});

	const {
		closeModal,
		handleConfirm,
		handleFileChange,
		handleSubmit,
		modalRef,
		selectedFile,
		uploadError,
	} = usePdfUploadForm({
		onConfirm: async () => {
			if (!selectedFile) return;
			setIsUploading(true);
			try {
				const result = await uploadPdf(selectedFile);
				if (!result.ok) {
					throw new Error(result.error);
				}
				saveMutation.mutate({
					fileName: selectedFile.name,
					filePath: result.key,
				});
			} catch {
				setIsUploading(false);
			}
		},
	});

	return (
		<>
			<form className={common.flexColumnGap2} onSubmit={handleSubmit}>
				<div className={common.flexBetween}>
					<h1 className="fr-h4 fr-mb-0">
						Parcours de mise en conformité pour l&apos;indicateur par catégorie
						de salariés
					</h1>
					<SavedIndicator />
				</div>

				<div className={common.flexColumnGap1}>
					<h2 className="fr-h5 fr-mb-0">
						Évaluation conjointe des rémunérations
					</h2>
					<p className="fr-mb-0">
						<a
							className="fr-link"
							href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
							rel="noopener noreferrer"
							target="_blank"
						>
							En savoir plus sur évaluation conjointe des rémunérations
							<NewTabNotice />
						</a>
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
						1<sup>er</sup> août {currentYear}
					</p>
					<p className="fr-mb-0 fr-text--sm fr-text--mention-grey">
						Déclaration effectuée le {declarationDate}
					</p>
				</div>

				<div>
					<label className="fr-label" htmlFor="joint-evaluation-file-upload">
						Veuillez importer/déposer le rapport de l&apos;évaluation conjointe.
						<span className="fr-hint-text">
							Taille maximale : 10 Mo. Format supporté : pdf.
						</span>
					</label>
				</div>

				<PdfFileUpload
					error={uploadError}
					inputId="joint-evaluation-file-upload"
					onFileChange={handleFileChange}
					selectedFile={selectedFile}
				/>

				<div>
					<div className="fr-callout fr-callout--blue-france">
						<h3 className="fr-callout__title fr-h6">
							Ce que vous devez faire dans un délai de 2 mois
						</h3>
						<ul className="fr-mb-0">
							<li>Élaboration du rapport</li>
							<li>
								Déposez le rapport dans la zone de dépôt prévue sur cette page
							</li>
						</ul>
					</div>
					<div className="fr-callout">
						<h3 className="fr-callout__title fr-h6">Après dépôt du rapport</h3>
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
					<button
						className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
						disabled={isUploading || saveMutation.isPending}
						type="submit"
					>
						Transmettre
					</button>
				</div>
			</form>

			<JointEvaluationSubmitModal
				modalRef={modalRef}
				onClose={closeModal}
				onSubmit={handleConfirm}
			/>
		</>
	);
}
