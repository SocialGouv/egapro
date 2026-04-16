import Link from "next/link";

import type { CountyCode, RegionCode } from "~/modules/domain";
import { COUNTIES, REGIONS } from "~/modules/domain";
import { Breadcrumb, NewTabNotice } from "~/modules/layout";

import type { PublicReferentDetail as PublicReferentDetailData } from "./types";

type Props = {
	referent: PublicReferentDetailData;
};

export function PublicReferentDetail({ referent }: Props) {
	const regionLabel = REGIONS[referent.region as RegionCode] ?? referent.region;
	const countyLabel = referent.county
		? (COUNTIES[referent.county as CountyCode] ?? referent.county)
		: null;

	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<Breadcrumb
				items={[
					{ label: "Accueil", href: "/" },
					{
						label: "Référents Égalité Professionnelle",
						href: "/referents",
					},
					{ label: referent.name },
				]}
			/>

			<Link
				className="fr-link fr-icon-arrow-left-line fr-link--icon-left fr-mb-2w"
				href="/referents"
			>
				Retour à la recherche
			</Link>

			<h1 className="fr-h2 fr-mt-4w">{referent.name}</h1>
			<p className="fr-text--lg fr-text-mention--grey fr-mb-1w">
				{regionLabel}
				{countyLabel ? ` — ${countyLabel}` : ""}
			</p>
			{referent.principal && (
				<p className="fr-badge fr-badge--success fr-badge--no-icon fr-mb-3w">
					Référent principal
				</p>
			)}

			<h2 className="fr-h5 fr-mt-3w">Contact</h2>
			<ContactLink type={referent.type} value={referent.value} />

			{referent.substituteName && (
				<>
					<h2 className="fr-h5 fr-mt-4w">Suppléant</h2>
					<p>{referent.substituteName}</p>
					{referent.substituteEmail && (
						<p>
							<a
								className="fr-link"
								href={`mailto:${referent.substituteEmail}`}
							>
								<span
									aria-hidden="true"
									className="fr-icon-mail-fill fr-icon--sm fr-mr-1v"
								/>
								{referent.substituteEmail}
							</a>
						</p>
					)}
				</>
			)}
		</main>
	);
}

type ContactLinkProps = {
	type: "email" | "url";
	value: string;
};

function ContactLink({ type, value }: ContactLinkProps) {
	if (type === "email") {
		return (
			<p>
				<a className="fr-link" href={`mailto:${value}`}>
					<span
						aria-hidden="true"
						className="fr-icon-mail-fill fr-icon--sm fr-mr-1v"
					/>
					{value}
				</a>
			</p>
		);
	}

	return (
		<p>
			<a
				className="fr-link"
				href={value}
				rel="noopener noreferrer"
				target="_blank"
			>
				<span
					aria-hidden="true"
					className="fr-icon-external-link-line fr-icon--sm fr-mr-1v"
				/>
				{value}
				<NewTabNotice />
			</a>
		</p>
	);
}
