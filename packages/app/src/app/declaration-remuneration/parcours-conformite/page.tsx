import { redirect } from "next/navigation";

import {
	CompliancePathChoice,
	hasGapsAboveThreshold,
} from "~/modules/declaration-remuneration";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function CompliancePathPage() {
	const session = await auth();
	const data = await api.declaration.getOrCreate();

	if (data.declaration.status !== "submitted") {
		redirect("/declaration-remuneration/etape/6");
	}

	const step5Categories = data.employeeCategories.filter(
		(c) => c.declarationType === "initial",
	);

	if (!hasGapsAboveThreshold(step5Categories)) {
		redirect("/avis-cse");
	}

	// If previous path was corrective_action and gaps persist, force joint_evaluation
	const forcedPath =
		data.declaration.compliancePath === "corrective_action"
			? ("joint_evaluation" as const)
			: undefined;

	const email = session?.user?.email ?? "";
	const currentYear = new Date().getFullYear();

	return (
		<HydrateClient>
			<CompliancePathChoice
				currentYear={currentYear}
				email={email}
				forcedPath={forcedPath}
				initialPath={
					(data.declaration.compliancePath as
						| "justify"
						| "corrective_action"
						| "joint_evaluation"
						| null) ?? undefined
				}
			/>
		</HydrateClient>
	);
}
