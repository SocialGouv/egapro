import { notFound, redirect } from "next/navigation";
import { TOTAL_STEPS } from "~/modules/declaration-remuneration";
import { api, HydrateClient } from "~/trpc/server";
import { StepPageClient } from "./StepPageClient";

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

	// If declaration is already submitted, redirect non-recap steps to the recap
	if (data.declaration.status === "submitted" && step !== 6) {
		redirect("/declaration/etape/6");
	}

	const stepCategories = (s: number) =>
		data.categories
			.filter((c) => c.step === s)
			.map((c) => ({
				name: c.categoryName,
				womenCount: c.womenCount ?? undefined,
				menCount: c.menCount ?? undefined,
				womenValue: c.womenValue ?? undefined,
				menValue: c.menValue ?? undefined,
				womenMedianValue: c.womenMedianValue ?? undefined,
				menMedianValue: c.menMedianValue ?? undefined,
			}));

	const step1Categories = data.categories
		.filter((c) => c.step === 1)
		.map((c) => ({
			name: c.categoryName,
			women: c.womenCount ?? 0,
			men: c.menCount ?? 0,
		}));

	const step2Rows = data.categories
		.filter((c) => c.step === 2)
		.map((c) => ({
			label: c.categoryName,
			womenValue: c.womenValue ?? "",
			menValue: c.menValue ?? "",
		}));

	const beneficiaryRow = data.categories.find(
		(c) => c.step === 3 && c.categoryName === "Bénéficiaires",
	);
	const step3Data = {
		rows: data.categories
			.filter((c) => c.step === 3 && c.categoryName !== "Bénéficiaires")
			.map((c) => ({
				label: c.categoryName,
				womenValue: c.womenValue ?? "",
				menValue: c.menValue ?? "",
			})),
		beneficiaryWomen: beneficiaryRow?.womenValue ?? "",
		beneficiaryMen: beneficiaryRow?.menValue ?? "",
	};

	return (
		<HydrateClient>
			<StepPageClient
				declaration={data.declaration}
				step={step}
				step1Categories={step1Categories}
				step2Rows={step2Rows}
				step3Data={step3Data}
				step4Categories={stepCategories(4)}
				step5Categories={stepCategories(5)}
			/>
		</HydrateClient>
	);
}
