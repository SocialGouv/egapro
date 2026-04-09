"use client";

import Link from "next/link";

import { api } from "~/trpc/react";

import {
	CompanySection,
	CseOpinionsSection,
	DeclarantSection,
	DeclarationSummary,
	FilesSection,
} from "./DetailSections";

type Props = {
	declarationId: string;
};

export function AdminDeclarationDetailPage({ declarationId }: Props) {
	const { data, isLoading } = api.adminDeclarations.getById.useQuery({
		id: declarationId,
	});

	if (isLoading) {
		return (
			<div>
				<p>Chargement...</p>
			</div>
		);
	}

	if (!data) {
		return (
			<div>
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
		<div>
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
