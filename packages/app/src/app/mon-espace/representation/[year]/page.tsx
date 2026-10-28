import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
	getRepresentationDeclarationSchema,
	RepresentationConsultation,
	representationDraftFromDeclaration,
} from "~/modules/declaration-representation";
import {
	getReferenceYearFor,
	isRepresentationDeclarationSubmitted,
	parseCampaignYear,
} from "~/modules/domain";
import { LAST_REPRESENTATION_STEP, LOGIN } from "~/modules/routes";
import { auth } from "~/server/auth";
import { resolveAuthorizedSiren } from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import { api } from "~/trpc/server";

type Props = {
	params: Promise<{ year: string }>;
};

function parseValidCampaignYear(yearParam: string): number | null {
	const campaignYear = parseCampaignYear(yearParam);
	if (campaignYear === null) return null;
	const validReferenceYear = getRepresentationDeclarationSchema.safeParse({
		year: getReferenceYearFor(campaignYear),
	}).success;
	return validReferenceYear ? campaignYear : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { year } = await params;
	const campaignYear = parseValidCampaignYear(year);

	return {
		title:
			campaignYear === null
				? "Démarche des indicateurs de représentation"
				: `Démarche des indicateurs de représentation ${campaignYear}`,
	};
}

export default async function RepresentationConsultationPage({
	params,
}: Props) {
	const { year } = await params;

	const session = await auth();
	if (!session?.user) {
		redirect(LOGIN);
	}

	// `?siren=` is never read: the SIREN comes exclusively from the session.
	const siren = await resolveAuthorizedSiren(db, session);
	if (!siren) notFound();

	const campaignYear = parseValidCampaignYear(year);
	if (campaignYear === null) notFound();

	const referenceYear = getReferenceYearFor(campaignYear);

	const { declaration } = await api.representationDeclaration.get({
		year: referenceYear,
	});
	if (!isRepresentationDeclarationSubmitted(declaration?.status)) {
		notFound();
	}

	const [company, declarant, workforceHistory] = await Promise.all([
		api.company.get({ siren }),
		api.representationDeclaration.getDeclarant({ year: referenceYear }),
		api.representationDeclaration.getWorkforceHistory({ campaignYear }),
	]);

	const draft = representationDraftFromDeclaration(
		declaration,
		LAST_REPRESENTATION_STEP,
	);
	const workforceEma =
		workforceHistory.find((entry) => entry.year === campaignYear)
			?.workforceEma ?? null;

	return (
		<RepresentationConsultation
			campaignYear={campaignYear}
			company={company}
			declarant={declarant}
			draft={draft}
			referenceYear={referenceYear}
			submittedAt={declaration?.submittedAt ?? null}
			workforceEma={workforceEma}
		/>
	);
}
