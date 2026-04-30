import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecapitulatifPage } from "~/modules/declaration-remuneration/recapitulatif";
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

	const { step2Data, step3Data, step4Data } = mapToStepData(d);

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
