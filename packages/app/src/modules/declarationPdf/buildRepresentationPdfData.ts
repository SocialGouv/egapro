import "server-only";

import { and, eq } from "drizzle-orm";

import { summarizeRepresentationReview } from "~/modules/declaration-representation/shared/reviewSummary";
import { representationDraftFromDeclaration } from "~/modules/declaration-representation/shared/submittedDraft";
import {
	type CompanyLocationRow,
	companyLocationRow,
	formatOptionalIsoDate,
	formatShortDate,
	formatSiren,
	formatWorkforceForUser,
	getRepresentationCampaignYear,
	isRepresentationDeclarationSubmitted,
	type RepresentationComplianceVerdict,
} from "~/modules/domain";
import { LAST_REPRESENTATION_STEP } from "~/modules/routes";
import { db } from "~/server/db";
import { getRepresentationWorkforceHistory } from "~/server/db/getRepresentationWorkforceHistory";
import {
	companies,
	representationDeclarations,
	users,
} from "~/server/db/schema";

import { formatNaf } from "./formatNaf";

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

export type RepresentationPdfInfoRow = { label: string; value: string };

export type RepresentationPdfData = {
	siren: string;
	year: number;
	campaignYear: number;
	submittedAt: Date | null;
	transmittedAt: string | null;
	referencePeriod: string;
	declarantRows: RepresentationPdfInfoRow[];
	company: {
		name: string;
		siren: string;
		location: CompanyLocationRow | null;
		naf: string;
		workforceLabel: string;
		workforceDisplay: string;
	};
	indicators: RepresentationPdfIndicator[];
	publicationApplicable: boolean;
	publishDate: string | null;
	hasWebsite: boolean;
	publishUrl: string | null;
	publishModalities: string | null;
	// Not shown (absent from the maquette) — kept only for `pdfSizeCache`'s per-call fingerprint.
	generatedAt: Date;
};

type Declarant = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	phone: string | null;
};

// Same omission rule as the consultation page's local `declarantInfoItems` — a row only when its value is present.
function buildDeclarantRows(
	declarant: Declarant | null,
): RepresentationPdfInfoRow[] {
	if (!declarant) return [];
	const rows: RepresentationPdfInfoRow[] = [];
	const name = [declarant.firstName, declarant.lastName]
		.filter(Boolean)
		.join(" ");
	if (name) rows.push({ label: "Nom Prénom", value: name });
	if (declarant.email) {
		rows.push({ label: "Adresse email", value: declarant.email });
	}
	if (declarant.phone) {
		rows.push({ label: "Numéro de téléphone", value: declarant.phone });
	}
	return rows;
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

	const [[declarant], workforceHistory] = await Promise.all([
		declaration.declarantId
			? db
					.select({
						firstName: users.firstName,
						lastName: users.lastName,
						email: users.email,
						phone: users.phone,
					})
					.from(users)
					.where(eq(users.id, declaration.declarantId))
					.limit(1)
			: Promise.resolve([] as Declarant[]),
		getRepresentationWorkforceHistory(siren, campaignYear),
	]);

	const workforceEma =
		workforceHistory.find((entry) => entry.year === campaignYear)
			?.workforceEma ?? null;

	const draft = representationDraftFromDeclaration(
		declaration,
		LAST_REPRESENTATION_STEP,
	);
	const summary = summarizeRepresentationReview(draft, campaignYear);

	const indicators: RepresentationPdfIndicator[] = summary.indicators.map(
		(indicator) => ({
			title: indicator.title,
			notComputableReason: indicator.notComputableReason,
			womenPercent: indicator.womenPercent ?? null,
			menPercent: indicator.menPercent ?? null,
			verdict: indicator.verdict,
		}),
	);

	return {
		siren,
		year,
		campaignYear,
		submittedAt: declaration.submittedAt,
		transmittedAt: declaration.submittedAt
			? formatShortDate(declaration.submittedAt)
			: null,
		referencePeriod: `${formatOptionalIsoDate(draft.referencePeriodStart)} - ${formatOptionalIsoDate(draft.referencePeriodEnd)}`,
		declarantRows: buildDeclarantRows(declarant ?? null),
		company: {
			name: company?.name ?? `Entreprise ${siren}`,
			siren: formatSiren(siren),
			location: companyLocationRow({
				countryCode: company?.countryCode ?? null,
				countryLabel: company?.countryLabel ?? null,
				departmentLabel: company?.departmentLabel ?? null,
				domesticAddress: company?.address ?? "",
			}),
			naf: formatNaf(company?.nafCode ?? null, company?.nafLabel ?? null),
			workforceLabel: `Effectif annuel moyen en ${year}`,
			workforceDisplay: formatWorkforceForUser(workforceEma),
		},
		indicators,
		publicationApplicable: summary.publicationApplicable,
		publishDate: draft.publishDate ?? null,
		hasWebsite: draft.hasWebsite === true,
		publishUrl: draft.publishUrl ?? null,
		publishModalities: draft.publishModalities ?? null,
		generatedAt: now,
	};
}
