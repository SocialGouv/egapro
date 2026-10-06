import { redirect } from "next/navigation";
import { HomePage } from "~/modules/home";
import { MY_SPACE } from "~/modules/routes";
import { auth } from "~/server/auth";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { getActiveCampaignYear } from "~/server/db/getGlobalSettings";
import { getRepresentationCampaign } from "~/server/db/getRepresentationCampaign";
import { HydrateClient } from "~/trpc/server";

export const metadata = { title: { absolute: "Accueil — Egapro" } };

// Reads live campaign settings from the DB (admins can change them anytime).
export const dynamic = "force-dynamic";

export default async function Page() {
	const session = await auth();

	if (session?.user) {
		redirect(MY_SPACE);
	}

	const year = await getActiveCampaignYear();
	const [remunerationDeadlines, representationCampaign] = await Promise.all([
		getCampaignDeadlines(year),
		getRepresentationCampaign(year),
	]);

	return (
		<HydrateClient>
			<HomePage
				remunerationDeadline={remunerationDeadlines.decl1ModificationDeadline}
				representationDeadline={representationCampaign.declarationDeadline}
			/>
		</HydrateClient>
	);
}
