import type { ReactNode } from "react";
import { TrackedLink } from "~/modules/analytics";
import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { formatLongDate } from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { apiV1FileHref } from "~/modules/routes";
import { FileUpload } from "~/modules/shared";
import styles from "./JointEvaluationReportBlocks.module.scss";

export type JointEvaluationExistingFile = {
	id: string;
	fileName: string;
	uploadedAt: Date;
};

export function JointEvaluationHeading({ title }: { title: string }) {
	return (
		<div className={common.flexColumnGapHalf}>
			<h2 className="fr-h5 fr-mb-0">{title}</h2>
			<p className="fr-mb-0">
				<TrackedLink
					className={`fr-link ${common.fontMedium}`}
					href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
					rel="noopener noreferrer"
					target="_blank"
					trackingId="joint_evaluation"
				>
					En savoir plus sur l&apos;évaluation conjointe des rémunérations
					<NewTabNotice />
				</TrackedLink>
			</p>
		</div>
	);
}

export function JointEvaluationExistingReport({
	file,
}: {
	file: JointEvaluationExistingFile;
}) {
	return (
		<div className={styles.panelWhite}>
			<p className="fr-mb-1v fr-text--bold">Rapport déjà déposé</p>
			<p className="fr-mb-1v">
				<a
					className="fr-link"
					href={apiV1FileHref(file.id)}
					rel="noopener noreferrer"
					target="_blank"
					title={`Visualiser ${file.fileName}`}
				>
					{file.fileName}
					<NewTabNotice />
				</a>
			</p>
			<p className="fr-mb-0 fr-text--xs fr-text-mention--grey">
				Déposé le {formatLongDate(file.uploadedAt)}
			</p>
		</div>
	);
}

type ReportUploadProps = {
	beforeDropzone?: ReactNode;
	inputId: string;
	disabled: boolean;
	error: string | null;
	hasMissingFile: boolean;
	onFilesChange: (files: File[], error: string | null) => void;
	selectedFiles: File[];
};

export function JointEvaluationReportUpload({
	beforeDropzone,
	inputId,
	disabled,
	error,
	hasMissingFile,
	onFilesChange,
	selectedFiles,
}: ReportUploadProps) {
	return (
		<>
			<div>
				<label className="fr-label" htmlFor={inputId}>
					Veuillez déposer le rapport de l&apos;évaluation conjointe.
					<span className="fr-hint-text fr-mt-1v">
						Taille maximale : 10 Mo. Format supporté : pdf.
					</span>
				</label>
			</div>

			{beforeDropzone}

			<FileUpload
				accept=".pdf"
				acceptLabel="pdf"
				allowedMimeTypes={["application/pdf"]}
				disabled={disabled}
				error={error}
				inputId={inputId}
				onFilesChange={onFilesChange}
				selectedFiles={selectedFiles}
			/>

			{/* `role="alert"` over a permanent `aria-live` wrapper: an always-rendered container is a flex item, and would add a phantom 2rem gap. */}
			{hasMissingFile && (
				<div className="fr-alert fr-alert--error" role="alert">
					<h3 className="fr-alert__title">
						Le rapport de l&apos;évaluation conjointe est manquant
					</h3>
					<p>
						Importez le rapport de l&apos;évaluation conjointe des rémunérations
						avant de le transmettre.
					</p>
				</div>
			)}
		</>
	);
}

export function JointEvaluationTodo({ title }: { title: string }) {
	return (
		<div className={styles.panelBlue}>
			<h3 className="fr-text--md fr-text--bold fr-mb-2w">{title}</h3>
			<ul className="fr-mb-0">
				<li>
					Réaliser l&apos;analyse conjointe et définir des actions correctrices
				</li>
				<li>
					Transmettre le rapport dans la zone de dépôt prévue sur cette page
				</li>
			</ul>
		</div>
	);
}

export function JointEvaluationAfterReport() {
	return (
		<div className={styles.panelWhite}>
			<h3 className="fr-text--md fr-text--bold fr-mb-2w">
				Après élaboration du rapport
			</h3>
			<ul className="fr-mb-2w">
				<li>Négocier un accord collectif</li>
				<li>À défaut, mettre en place un plan d&apos;action</li>
			</ul>
			<p className="fr-mb-0">
				L&apos;accord collectif ou le plan d&apos;action doit être déposé sur{" "}
				<a
					className={`fr-link ${common.fontMedium}`}
					href="https://www.teleaccord.travail.gouv.fr"
					rel="noopener noreferrer"
					target="_blank"
				>
					TéléAccords
					<NewTabNotice />
				</a>
			</p>
		</div>
	);
}
