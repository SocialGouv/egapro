import { notFound } from "next/navigation";
import { RecapitulatifPage } from "~/modules/declaration-remuneration/recapitulatif";
import { mapToEmployeeCategoryRows } from "~/server/api/routers/declarationHelpers";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";
import { api } from "~/trpc/server";

type Props = {
	searchParams: Promise<{ type?: string; siren?: string }>;
};

export default async function RecapitulatifRoute({ searchParams }: Props) {
	const { type } = await searchParams;
	const isCorrection = type === "correction";

	const session = await auth();
	if (!session?.user) notFound();

	const siren = getEffectiveSiren(session);
	if (!siren) notFound();

	const [data, company] = await Promise.all([
		api.declaration.getOrCreate(),
		api.company.get({ siren }),
	]);

	const d = data.declaration;

	if (isCorrection) {
		if (d.secondDeclarationStatus !== "submitted") notFound();
	} else {
		if (d.status !== "submitted") notFound();
	}

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

	const step4Data = {
		annual: [
			{
				threshold: d.indicatorFAnnualThreshold1 ?? "",
				women: d.indicatorFAnnualWomen1 ?? undefined,
				men: d.indicatorFAnnualMen1 ?? undefined,
			},
			{
				threshold: d.indicatorFAnnualThreshold2 ?? "",
				women: d.indicatorFAnnualWomen2 ?? undefined,
				men: d.indicatorFAnnualMen2 ?? undefined,
			},
			{
				threshold: d.indicatorFAnnualThreshold3 ?? "",
				women: d.indicatorFAnnualWomen3 ?? undefined,
				men: d.indicatorFAnnualMen3 ?? undefined,
			},
			{
				threshold: d.indicatorFAnnualThreshold4 ?? "",
				women: d.indicatorFAnnualWomen4 ?? undefined,
				men: d.indicatorFAnnualMen4 ?? undefined,
			},
		],
		hourly: [
			{
				threshold: d.indicatorFHourlyThreshold1 ?? "",
				women: d.indicatorFHourlyWomen1 ?? undefined,
				men: d.indicatorFHourlyMen1 ?? undefined,
			},
			{
				threshold: d.indicatorFHourlyThreshold2 ?? "",
				women: d.indicatorFHourlyWomen2 ?? undefined,
				men: d.indicatorFHourlyMen2 ?? undefined,
			},
			{
				threshold: d.indicatorFHourlyThreshold3 ?? "",
				women: d.indicatorFHourlyWomen3 ?? undefined,
				men: d.indicatorFHourlyMen3 ?? undefined,
			},
			{
				threshold: d.indicatorFHourlyThreshold4 ?? "",
				women: d.indicatorFHourlyWomen4 ?? undefined,
				men: d.indicatorFHourlyMen4 ?? undefined,
			},
		],
	};

	const step5Categories =
		data.jobCategories.length > 0
			? mapToEmployeeCategoryRows(
					data.jobCategories,
					data.employeeCategories,
					isCorrection ? "correction" : "initial",
				)
			: [];

	return (
		<RecapitulatifPage
			company={company}
			declarantEmail={session.user.email ?? ""}
			declarationYear={d.year}
			isCorrection={isCorrection}
			step2Data={step2Data}
			step3Data={step3Data}
			step4Data={step4Data}
			step5Categories={step5Categories}
			totalMen={d.totalMen}
			totalWomen={d.totalWomen}
		/>
	);
}
