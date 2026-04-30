import { notFound, redirect } from "next/navigation";
import {
	StepPageClient,
	TOTAL_STEPS,
} from "~/modules/declaration-remuneration";
import { shouldRedirectSubmittedToRecap } from "~/modules/domain";
import {
	mapToEmployeeCategoryRows,
	mapToStepData,
} from "~/server/api/routers/declarationHelpers";
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

	const { step2Data, step3Data, step4Data } = mapToStepData(d);

	const hasCurrentYearCategories = data.jobCategories.length > 0;

	const step5Categories = hasCurrentYearCategories
		? mapToEmployeeCategoryRows(
				data.jobCategories,
				data.employeeCategories,
				"initial",
			)
		: (data.previousYearCategories?.categories.map((cat) => ({
				name: cat.name,
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
