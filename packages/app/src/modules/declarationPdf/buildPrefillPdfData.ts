import {
	type GipPrefillData,
	gipPayGapReferences,
	gipToQuartiles,
	gipToStep2,
	gipToStep3,
	type PayGapReferences,
	type Step2Data,
	type Step3Data,
	type Step4Data,
} from "~/modules/declaration-remuneration";
import {
	formatIsoDate,
	formatWorkforceForUser,
	getObligationWorkforce,
	getReferenceYearFor,
	isCseRequired,
	parseGipWorkforce,
} from "~/modules/domain";

import { formatCsePresence } from "./formatCsePresence";
import { formatNaf } from "./formatNaf";

export type PrefillPdfCompany = {
	name: string | null;
	address: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	hasCse: boolean | null;
};

export type PrefillPdfData = {
	siren: string;
	year: number;
	companyName: string;
	address: string;
	naf: string;
	workforceYear: number;
	workforceDisplay: string;
	cseDisplay: string | null;
	referencePeriod: string | null;
	totalWomen: number | null;
	totalMen: number | null;
	hourlyWomen: number | null;
	hourlyMen: number | null;
	step2Data: Step2Data;
	step2Gaps: PayGapReferences;
	step3Data: Step3Data;
	step3Gaps: PayGapReferences;
	step4Data: Step4Data;
};

type PrefillPdfSource = {
	siren: string;
	year: number;
	gip: GipPrefillData;
	workforceEma: string | number | null;
	company: PrefillPdfCompany | undefined;
};

function formatPeriod(
	start: string | null | undefined,
	end: string | null,
): string | null {
	if (!start || !end) return null;
	return `${formatIsoDate(start)} - ${formatIsoDate(end)}`;
}

export function buildPrefillPdfData({
	siren,
	year,
	gip,
	workforceEma,
	company,
}: PrefillPdfSource): PrefillPdfData {
	const workforce = parseGipWorkforce(workforceEma);
	const cseApplicable = isCseRequired(getObligationWorkforce(workforce));

	return {
		siren,
		year,
		companyName: company?.name ?? `Entreprise ${siren}`,
		address: company?.address ?? "",
		naf: formatNaf(company?.nafCode ?? null, company?.nafLabel ?? null),
		workforceYear: getReferenceYearFor(year),
		workforceDisplay: formatWorkforceForUser(workforce),
		cseDisplay: cseApplicable
			? formatCsePresence(company?.hasCse ?? null)
			: null,
		referencePeriod: formatPeriod(gip.periodStart, gip.periodEnd),
		...gip.step1,
		step2Data: gipToStep2(gip.step2),
		step2Gaps: gipPayGapReferences(gip.step2),
		step3Data: gipToStep3(gip.step3),
		step3Gaps: gipPayGapReferences(gip.step3),
		step4Data: {
			annual: gipToQuartiles(gip.step4.annual),
			hourly: gipToQuartiles(gip.step4.hourly),
		},
	};
}
