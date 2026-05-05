import { notFound, redirect } from "next/navigation";
import {
	StepPageClient,
	TOTAL_STEPS,
} from "~/modules/declaration-remuneration";
import {
	migrateLegacyThresholds,
	shouldRedirectSubmittedToRecap,
} from "~/modules/domain";
import { mapToEmployeeCategoryRows } from "~/server/api/routers/declarationHelpers";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api, HydrateClient } from "~/trpc/server";

type StepPageProps = {
	params: Promise<{ step: string }>;
};

export default async function StepPage({ params }: StepPageProps) {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);

	if (Number.isNaN(step) || step < 1 || step > TOTAL_STEPS) {
		notFound();
	}

	const data = await api.declaration.getOrCreate();
	const d = data.declaration;

	if (d.status === "submitted" && step !== 6) {
		const { decl1ModificationDeadline } = await getCampaignDeadlines(d.year);
		if (
			shouldRedirectSubmittedToRecap({
				status: d.status,
				step,
				recapStep: 6,
				modificationDeadline: decl1ModificationDeadline,
			})
		) {
			redirect("/declaration-remuneration/etape/6");
		}
	}

	const gip = data.gipPrefillData;

	const step1Data = {
		totalWomen: d.totalWomen ?? gip?.step1.totalWomen ?? 0,
		totalMen: d.totalMen ?? gip?.step1.totalMen ?? 0,
	};

	const step2Data = {
		indicatorAAnnualWomen: d.indicatorAAnnualWomen ?? "",
		indicatorAAnnualMen: d.indicatorAAnnualMen ?? "",
		indicatorAHourlyWomen: d.indicatorAHourlyWomen ?? "",
		indicatorAHourlyMen: d.indicatorAHourlyMen ?? "",
		indicatorCAnnualWomen: d.indicatorCAnnualWomen ?? "",
		indicatorCAnnualMen: d.indicatorCAnnualMen ?? "",
		indicatorCHourlyWomen: d.indicatorCHourlyWomen ?? "",
		indicatorCHourlyMen: d.indicatorCHourlyMen ?? "",
	};

	const step3Data = {
		indicatorBAnnualWomen: d.indicatorBAnnualWomen ?? "",
		indicatorBAnnualMen: d.indicatorBAnnualMen ?? "",
		indicatorBHourlyWomen: d.indicatorBHourlyWomen ?? "",
		indicatorBHourlyMen: d.indicatorBHourlyMen ?? "",
		indicatorDAnnualWomen: d.indicatorDAnnualWomen ?? "",
		indicatorDAnnualMen: d.indicatorDAnnualMen ?? "",
		indicatorDHourlyWomen: d.indicatorDHourlyWomen ?? "",
		indicatorDHourlyMen: d.indicatorDHourlyMen ?? "",
		indicatorEWomen: d.indicatorEWomen ?? "",
		indicatorEMen: d.indicatorEMen ?? "",
	};

	const annualThresholds = migrateLegacyThresholds([
		d.indicatorFAnnualThreshold1,
		d.indicatorFAnnualThreshold2,
		d.indicatorFAnnualThreshold3,
	]);
	const hourlyThresholds = migrateLegacyThresholds([
		d.indicatorFHourlyThreshold1,
		d.indicatorFHourlyThreshold2,
		d.indicatorFHourlyThreshold3,
	]);

	const step4Data = {
		annual: [
			{
				threshold: annualThresholds[0],
				women: d.indicatorFAnnualWomen1 ?? undefined,
				men: d.indicatorFAnnualMen1 ?? undefined,
			},
			{
				threshold: annualThresholds[1],
				women: d.indicatorFAnnualWomen2 ?? undefined,
				men: d.indicatorFAnnualMen2 ?? undefined,
			},
			{
				threshold: annualThresholds[2],
				women: d.indicatorFAnnualWomen3 ?? undefined,
				men: d.indicatorFAnnualMen3 ?? undefined,
			},
			{
				threshold: undefined,
				women: d.indicatorFAnnualWomen4 ?? undefined,
				men: d.indicatorFAnnualMen4 ?? undefined,
			},
		],
		hourly: [
			{
				threshold: hourlyThresholds[0],
				women: d.indicatorFHourlyWomen1 ?? undefined,
				men: d.indicatorFHourlyMen1 ?? undefined,
			},
			{
				threshold: hourlyThresholds[1],
				women: d.indicatorFHourlyWomen2 ?? undefined,
				men: d.indicatorFHourlyMen2 ?? undefined,
			},
			{
				threshold: hourlyThresholds[2],
				women: d.indicatorFHourlyWomen3 ?? undefined,
				men: d.indicatorFHourlyMen3 ?? undefined,
			},
			{
				threshold: undefined,
				women: d.indicatorFHourlyWomen4 ?? undefined,
				men: d.indicatorFHourlyMen4 ?? undefined,
			},
		],
	};

	const hasCurrentYearCategories = data.jobCategories.length > 0;

	const step5Categories = hasCurrentYearCategories
		? mapToEmployeeCategoryRows(
				data.jobCategories,
				data.employeeCategories,
				"initial",
			)
		: (data.previousYearCategories?.categories.map((cat) => ({
				name: cat.name,
				detail: cat.detail,
				womenCount: null,
				menCount: null,
				annualBaseWomen: null,
				annualBaseMen: null,
				annualVariableWomen: null,
				annualVariableMen: null,
				hourlyBaseWomen: null,
				hourlyBaseMen: null,
				hourlyVariableWomen: null,
				hourlyVariableMen: null,
			})) ?? []);

	const initialSource = hasCurrentYearCategories
		? data.jobCategories[0]?.source
		: (data.previousYearCategories?.source ?? undefined);

	return (
		<HydrateClient>
			<StepPageClient
				declaration={d}
				gipPrefillData={data.gipPrefillData ?? undefined}
				initialSource={initialSource}
				step={step}
				step1Data={step1Data}
				step2Data={step2Data}
				step3Data={step3Data}
				step4Data={step4Data}
				step5Categories={step5Categories}
			/>
		</HydrateClient>
	);
}
