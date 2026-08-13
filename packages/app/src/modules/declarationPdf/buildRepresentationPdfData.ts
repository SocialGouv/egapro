import "server-only";

import { and, eq } from "drizzle-orm";
import {
	computeRepresentationVerdict,
	type ExecutivesCount,
	getRepresentationCampaignYear,
	isRepresentationDeclarationSubmitted,
	isRepresentationPublicationRequired,
	type RepresentationComplianceVerdict,
} from "~/modules/domain";
import { db } from "~/server/db";
import { companies, representationDeclarations } from "~/server/db/schema";

export class RepresentationDeclarationNotFoundError extends Error {
	constructor() {
		super("Déclaration de représentation équilibrée introuvable");
		this.name = "RepresentationDeclarationNotFoundError";
	}
}

export type RepresentationPdfIndicator = {
	title: string;
	notComputableReason: string | null;
	womenPercent: number | null;
	menPercent: number | null;
	verdict: RepresentationComplianceVerdict;
};

export type RepresentationPdfData = {
	companyName: string;
	siren: string;
	year: number;
	campaignYear: number;
	referencePeriodStart: string | null;
	referencePeriodEnd: string | null;
	indicators: RepresentationPdfIndicator[];
	publicationApplicable: boolean;
	publishDate: string | null;
	hasWebsite: boolean;
	publishUrl: string | null;
	publishModalities: string | null;
	submittedAt: Date | null;
	generatedAt: Date;
};

const NOT_COMPUTABLE_EXECUTIVES_LABELS: Record<
	"aucun_cadre_dirigeant" | "un_seul_cadre_dirigeant",
	string
> = {
	aucun_cadre_dirigeant: "Aucun cadre dirigeant",
	un_seul_cadre_dirigeant: "Un cadre dirigeant",
};

const NOT_COMPUTABLE_MEMBERS_LABEL = "Aucune instance dirigeante";

function toPercent(value: string | null): number | null {
	return value === null ? null : Number(value);
}

export async function buildRepresentationPdfData(
	siren: string,
	year: number,
	now: Date,
): Promise<RepresentationPdfData> {
	const [[company], [declaration]] = await Promise.all([
		db.select().from(companies).where(eq(companies.siren, siren)).limit(1),
		db
			.select()
			.from(representationDeclarations)
			.where(
				and(
					eq(representationDeclarations.siren, siren),
					eq(representationDeclarations.year, year),
				),
			)
			.limit(1),
	]);

	if (
		!declaration ||
		!isRepresentationDeclarationSubmitted(declaration.status)
	) {
		throw new RepresentationDeclarationNotFoundError();
	}

	const campaignYear = getRepresentationCampaignYear(year);

	const executivesWomenPercent = toPercent(declaration.executiveWomenPercent);
	const executivesMenPercent = toPercent(declaration.executiveMenPercent);
	const membersWomenPercent = toPercent(declaration.memberWomenPercent);
	const membersMenPercent = toPercent(declaration.memberMenPercent);

	const executivesCount: ExecutivesCount =
		declaration.notComputableReasonExecutives === "aucun_cadre_dirigeant"
			? "none"
			: declaration.notComputableReasonExecutives === "un_seul_cadre_dirigeant"
				? "one"
				: "two_or_more";
	const hasManagementBody = declaration.notComputableReasonMembers === null;

	const indicators: RepresentationPdfIndicator[] = [
		{
			title: "Cadres dirigeants",
			notComputableReason: declaration.notComputableReasonExecutives
				? NOT_COMPUTABLE_EXECUTIVES_LABELS[
						declaration.notComputableReasonExecutives
					]
				: null,
			womenPercent: executivesWomenPercent,
			menPercent: executivesMenPercent,
			verdict: computeRepresentationVerdict(
				executivesWomenPercent,
				executivesMenPercent,
				campaignYear,
			),
		},
		{
			title: "Membres des instances dirigeantes",
			notComputableReason: hasManagementBody
				? null
				: NOT_COMPUTABLE_MEMBERS_LABEL,
			womenPercent: membersWomenPercent,
			menPercent: membersMenPercent,
			verdict: computeRepresentationVerdict(
				membersWomenPercent,
				membersMenPercent,
				campaignYear,
			),
		},
	];

	return {
		companyName: company?.name ?? `Entreprise ${siren}`,
		siren,
		year,
		campaignYear,
		referencePeriodStart: declaration.referencePeriodStart,
		referencePeriodEnd: declaration.referencePeriodEnd,
		indicators,
		publicationApplicable: isRepresentationPublicationRequired(
			executivesCount,
			hasManagementBody,
		),
		publishDate: declaration.publishDate,
		hasWebsite: declaration.publishUrl !== null,
		publishUrl: declaration.publishUrl,
		publishModalities: declaration.publishModalities,
		submittedAt: declaration.submittedAt,
		generatedAt: now,
	};
}
