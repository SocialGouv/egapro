import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	getEffectiveGipPrefillData,
	STEP_TITLES,
	StepPageClient,
	TOTAL_STEPS,
} from "~/modules/declaration-remuneration";
import { isDeadlinePassed, isDeclarationSubmitted } from "~/modules/domain";
import {
	mapToEmployeeCategoryRows,
	mapToStepData,
} from "~/server/api/routers/declarationHelpers";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api, HydrateClient } from "~/trpc/server";

type StepPageProps = {
	params: Promise<{ step: string }>;
};

export async function generateMetadata({
	params,
}: StepPageProps): Promise<Metadata> {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);
	const stepTitle = STEP_TITLES[step];

	return {
		title: stepTitle
			? `Étape ${step} sur ${TOTAL_STEPS} — ${stepTitle}`
			: "Déclaration des écarts de rémunération",
	};
}

export default async function StepPage({ params }: StepPageProps) {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);

	if (Number.isNaN(step) || step < 1 || step > TOTAL_STEPS) {
		notFound();
	}

	const data = await api.declaration.getOrCreate();
	const d = data.declaration;
	const company = await api.company.get({ siren: d.siren });

	const isSubmitted = isDeclarationSubmitted(d.status);
	let modificationDeadline: Date | undefined;
	let isModificationClosed = false;
	if (isSubmitted) {
		const deadlines = await getCampaignDeadlines(d.year);
		modificationDeadline = deadlines.decl1ModificationDeadline;
		isModificationClosed = isDeadlinePassed(modificationDeadline);
	}

	const gip = data.gipPrefillData;

	const step1Data = {
		totalWomen: d.totalWomen ?? gip?.step1.totalWomen ?? 0,
		totalMen: d.totalMen ?? gip?.step1.totalMen ?? 0,
	};

	const effectiveGipPrefillData = getEffectiveGipPrefillData(
		gip,
		d.totalWomen,
		d.totalMen,
	);

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
				companyWorkforce={company.workforce}
				declaration={d}
				gipPrefillData={effectiveGipPrefillData ?? undefined}
				hasCse={company.hasCse}
				initialSource={initialSource}
				modificationClosed={isModificationClosed}
				modificationDeadline={modificationDeadline}
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
