"use client";

import Link from "next/link";

import { api } from "~/trpc/react";

import type { DeclarationDetail } from "./types";

type Props = {
	declarationId: string;
};

const STATUS_LABELS: Record<string, string> = {
	draft: "Brouillon",
	submitted: "Transmise",
};

function formatDate(date: Date | null | undefined): string {
	if (!date) return "—";
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

export function AdminDeclarationDetailPage({ declarationId }: Props) {
	const { data, isLoading } = api.adminDeclarations.getById.useQuery({
		id: declarationId,
	});

	if (isLoading) {
		return (
			<div className="fr-container fr-py-4w">
				<p>Chargement...</p>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="fr-container fr-py-4w">
				<div className="fr-alert fr-alert--error">
					<p>Déclaration introuvable.</p>
				</div>
				<Link className="fr-link fr-mt-2w" href="/admin/declarations">
					Retour à la liste
				</Link>
			</div>
		);
	}

	return (
		<div className="fr-container fr-py-4w">
			<Link
				className="fr-link fr-icon-arrow-left-line fr-link--icon-left fr-mb-4w"
				href="/admin/declarations"
			>
				Retour à la liste
			</Link>
			<h1 className="fr-h3 fr-mt-2w">
				{data.companyName} — {data.year}
			</h1>
			<DeclarationSummary declaration={data} />
			<CompanySection declaration={data} />
			<DeclarantSection declaration={data} />
			{data.cseOpinions.length > 0 && (
				<CseOpinionsSection opinions={data.cseOpinions} />
			)}
			{data.files.length > 0 && <FilesSection files={data.files} />}
		</div>
	);
}

function DeclarationSummary({
	declaration,
}: {
	declaration: DeclarationDetail;
}) {
	return (
		<div className="fr-table fr-mb-4w">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption className="fr-sr-only">
								Informations générales de la déclaration
							</caption>
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
										{STATUS_LABELS[declaration.status ?? ""] ??
											declaration.status}
									</td>
								</tr>
								<tr>
									<th scope="row">Index de rémunération</th>
									<td>{declaration.remunerationScore ?? "—"}</td>
								</tr>
								<tr>
									<th scope="row">Effectif femmes / hommes</th>
									<td>
										{declaration.totalWomen ?? "—"} /{" "}
										{declaration.totalMen ?? "—"}
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
									<td>{formatDate(declaration.createdAt)}</td>
								</tr>
								<tr>
									<th scope="row">Dernière modification</th>
									<td>{formatDate(declaration.updatedAt)}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

function CompanySection({ declaration }: { declaration: DeclarationDetail }) {
	return (
		<>
			<h2 className="fr-h5">Entreprise</h2>
			<div className="fr-table fr-mb-4w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption className="fr-sr-only">
									Informations sur l'entreprise
								</caption>
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
							</table>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

function DeclarantSection({ declaration }: { declaration: DeclarationDetail }) {
	return (
		<>
			<h2 className="fr-h5">Déclarant</h2>
			<div className="fr-table fr-mb-4w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption className="fr-sr-only">
									Informations sur le déclarant
								</caption>
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
							</table>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

function CseOpinionsSection({
	opinions,
}: {
	opinions: DeclarationDetail["cseOpinions"];
}) {
	return (
		<>
			<h2 className="fr-h5">Avis CSE</h2>
			<div className="fr-table fr-mb-4w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption className="fr-sr-only">Liste des avis CSE</caption>
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
							</table>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

function FilesSection({ files }: { files: DeclarationDetail["files"] }) {
	return (
		<>
			<h2 className="fr-h5">Fichiers</h2>
			<div className="fr-table fr-mb-4w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption className="fr-sr-only">
									Fichiers associés à la déclaration
								</caption>
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
											<td>{formatDate(file.uploadedAt)}</td>
											<td>
												<a
													aria-label={`Télécharger ${file.fileName}`}
													className="fr-btn fr-btn--sm fr-btn--secondary fr-btn--icon-left fr-icon-download-line"
													download
													href={`/api/admin/files/${file.id}`}
												>
													Télécharger
												</a>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
