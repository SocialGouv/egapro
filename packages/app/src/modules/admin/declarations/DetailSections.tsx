import { formatShortDate, formatShortDateTime } from "~/modules/domain";
import { DsfrTable } from "~/modules/shared/DsfrTable";

import { STATUS_LABELS } from "./shared/constants";
import type { DeclarationDetail } from "./types";

export function CancelledBadge({ cancelledAt }: { cancelledAt: Date }) {
	return (
		<div className="fr-alert fr-alert--warning fr-mb-3w" role="alert">
			<p>Annulée le {formatShortDate(cancelledAt)}</p>
		</div>
	);
}

export function DeclarationSummary({
	declaration,
}: {
	declaration: DeclarationDetail;
}) {
	return (
		<DsfrTable caption="Informations générales de la déclaration">
			<tbody>
				<tr>
					<th scope="row">SIREN</th>
					<td>{declaration.siren}</td>
				</tr>
				<tr>
					<th scope="row">Année</th>
					<td>{declaration.year}</td>
				</tr>
				<tr>
					<th scope="row">Statut</th>
					<td>
						{STATUS_LABELS[declaration.status ?? ""] ?? declaration.status}
					</td>
				</tr>
				<tr>
					<th scope="row">Index de rémunération</th>
					<td>{declaration.remunerationScore ?? "—"}</td>
				</tr>
				<tr>
					<th scope="row">Effectif femmes / hommes</th>
					<td>
						{declaration.totalWomen ?? "—"} / {declaration.totalMen ?? "—"}
					</td>
				</tr>
				<tr>
					<th scope="row">Étape actuelle</th>
					<td>{declaration.currentStep ?? "—"}</td>
				</tr>
				<tr>
					<th scope="row">Parcours conformité</th>
					<td>{declaration.compliancePath ?? "—"}</td>
				</tr>
				<tr>
					<th scope="row">Date de création</th>
					<td>{formatShortDateTime(declaration.createdAt)}</td>
				</tr>
				<tr>
					<th scope="row">Dernière modification</th>
					<td>{formatShortDateTime(declaration.updatedAt)}</td>
				</tr>
			</tbody>
		</DsfrTable>
	);
}

export function CompanySection({
	declaration,
}: {
	declaration: DeclarationDetail;
}) {
	return (
		<>
			<h2 className="fr-h5">Entreprise</h2>
			<DsfrTable caption="Informations sur l'entreprise">
				<tbody>
					<tr>
						<th scope="row">Nom</th>
						<td>{declaration.companyName}</td>
					</tr>
					<tr>
						<th scope="row">Adresse</th>
						<td>{declaration.companyAddress ?? "—"}</td>
					</tr>
					<tr>
						<th scope="row">Code NAF</th>
						<td>{declaration.companyNafCode ?? "—"}</td>
					</tr>
					<tr>
						<th scope="row">Effectif</th>
						<td>{declaration.companyWorkforce ?? "—"}</td>
					</tr>
					<tr>
						<th scope="row">CSE</th>
						<td>
							{declaration.companyHasCse === null
								? "—"
								: declaration.companyHasCse
									? "Oui"
									: "Non"}
						</td>
					</tr>
				</tbody>
			</DsfrTable>
		</>
	);
}

export function DeclarantSection({
	declaration,
}: {
	declaration: DeclarationDetail;
}) {
	return (
		<>
			<h2 className="fr-h5">Déclarant</h2>
			<DsfrTable caption="Informations sur le déclarant">
				<tbody>
					<tr>
						<th scope="row">Nom</th>
						<td>
							{declaration.declarantFirstName ?? ""}{" "}
							{declaration.declarantLastName ?? ""}
						</td>
					</tr>
					<tr>
						<th scope="row">Email</th>
						<td>{declaration.declarantEmail}</td>
					</tr>
					<tr>
						<th scope="row">Téléphone</th>
						<td>{declaration.declarantPhone ?? "—"}</td>
					</tr>
				</tbody>
			</DsfrTable>
		</>
	);
}

export function CseOpinionsSection({
	opinions,
}: {
	opinions: DeclarationDetail["cseOpinions"];
}) {
	return (
		<>
			<h2 className="fr-h5">Avis CSE</h2>
			<DsfrTable caption="Liste des avis CSE">
				<thead>
					<tr>
						<th scope="col">Type</th>
						<th scope="col">Avis</th>
						<th scope="col">Date</th>
					</tr>
				</thead>
				<tbody>
					{opinions.map((opinion) => (
						<tr key={opinion.id}>
							<td>{opinion.type}</td>
							<td>{opinion.opinion ?? "—"}</td>
							<td>{opinion.opinionDate ?? "—"}</td>
						</tr>
					))}
				</tbody>
			</DsfrTable>
		</>
	);
}

export function FilesSection({ files }: { files: DeclarationDetail["files"] }) {
	return (
		<>
			<h2 className="fr-h5">Fichiers</h2>
			<DsfrTable caption="Fichiers associés à la déclaration">
				<thead>
					<tr>
						<th scope="col">Nom</th>
						<th scope="col">Type</th>
						<th scope="col">Date</th>
						<th scope="col">Action</th>
					</tr>
				</thead>
				<tbody>
					{files.map((file) => (
						<tr key={file.id}>
							<td>{file.fileName}</td>
							<td>
								{file.type === "cse_opinion"
									? "Avis CSE"
									: "Évaluation conjointe"}
							</td>
							<td>{formatShortDate(file.uploadedAt)}</td>
							<td>
								<a
									aria-label={`Télécharger ${file.fileName}`}
									className="fr-btn fr-btn--sm fr-btn--secondary fr-btn--icon-left fr-icon-download-line"
									download
									href={`/api/v1/files/${file.id}`}
								>
									Télécharger
								</a>
							</td>
						</tr>
					))}
				</tbody>
			</DsfrTable>
		</>
	);
}
