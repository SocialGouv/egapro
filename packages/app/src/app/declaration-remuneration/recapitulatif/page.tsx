import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecapitulatifPage } from "~/modules/declaration-remuneration/recapitulatif";
import { getReferencePeriod, isDraft } from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import {
	mapToEmployeeCategoryRows,
	mapToStepData,
} from "~/server/api/routers/declarationHelpers";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Récapitulatif de la déclaration",
};

type Props = {
	// `?siren=` may appear in the URL as a UX hint (mirroring the modify
	// links in Mon Espace), but the route never reads it — security relies
	// on the session SIREN bound by `companyProcedure`. Not in the type.
	searchParams: Promise<{ type?: string }>;
};

export default async function RecapitulatifRoute({ searchParams }: Props) {
	const { type } = await searchParams;
	const isCorrection = type === "correction";

	const session = await auth();
	if (!session?.user) notFound();

	const siren = getEffectiveSiren(session);
	if (!siren) notFound();

	// FIXME(#3373-followup): `getOrCreate` may insert an empty `draft` row
	// for a session that has never started a declaration, then we 404 right
	// after. Harmless (the draft is later either submitted or pruned) but
	// not ideal on a read-only page. A future PR can introduce a `get` query
	// that returns null without writing.
	const [data, company] = await Promise.all([
		api.declaration.getOrCreate(),
		api.company.get({ siren }),
	]);

	const d = data.declaration;

	if (isCorrection) {
		if (!data.hasSubmittedSecondDeclaration) notFound();
	} else {
		if (isDraft(d.status)) notFound();
	}

	const { step2Data, step3Data, step4Data } = mapToStepData(d);

	// declarations does not store custom period windows — every declaration
	// covers the full calendar year. The period is derived from d.year.
	const referencePeriod = getReferencePeriod(d.year);

	const step5Categories =
		data.jobCategories.length > 0
			? mapToEmployeeCategoryRows(
					data.jobCategories,
					data.employeeCategories,
					isCorrection ? "correction" : "initial",
				)
			: [];

	const step5Source = data.jobCategories[0]?.source ?? null;

	return (
		<>
			{/* Breadcrumb + back link sit at the page-container edge (under
			    the Marianne logo), not inside the constrained content
			    column — matches Figma 9394:247502. */}
			<div className="fr-container fr-pt-3w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Mon espace", href: "/mon-espace" },
						{ label: `Récapitulatif de la déclaration ${d.year}` },
					]}
				/>
				<Link
					className="fr-link fr-icon-arrow-left-line fr-link--icon-left fr-mt-2w"
					href="/mon-espace"
				>
					Retour
				</Link>
			</div>

			<main className="fr-container fr-pb-7w fr-pt-7w" id="content">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-lg-8">
						<RecapitulatifPage
							company={{
								name: company.name,
								siren: company.siren,
								nafCode: company.nafCode,
								address: company.address,
								workforce: company.workforce,
							}}
							declarantEmail={session.user.email ?? ""}
							declarantName={session.user.name ?? ""}
							declarationYear={d.year}
							isCorrection={isCorrection}
							referencePeriod={referencePeriod}
							step2Data={step2Data}
							step3Data={step3Data}
							step4Data={step4Data}
							step5Categories={step5Categories}
							step5Source={step5Source}
							totalMen={d.totalMen}
							totalWomen={d.totalWomen}
						/>
					</div>
				</div>
			</main>
		</>
	);
}
