import "server-only";

import { redirect } from "next/navigation";

import { getCurrentYear } from "~/modules/domain";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api } from "~/trpc/server";

import { CompanyDeclarationsPage } from "./CompanyDeclarationsPage";

const SIREN_LENGTH = 9;

type Props = {
	siret: string | null;
	userPhone: string | null;
};

export async function MonEspacePage({ siret, userPhone }: Props) {
	if (!siret || siret.length < SIREN_LENGTH) {
		redirect("/mon-espace/mes-entreprises");
	}

	const siren = siret.slice(0, SIREN_LENGTH);
	const [data, sanctionStatus, campaignDeadlines] = await Promise.all([
		api.company.getWithDeclarations({ siren }),
		api.company.getSanctionStatus({ siren }),
		getCampaignDeadlines(getCurrentYear()),
	]);

	const hasNoSanction = sanctionStatus !== null && !sanctionStatus.hasSanction;

	return (
		<CompanyDeclarationsPage
			campaignDeadlines={campaignDeadlines}
			company={data.company}
			declarations={data.declarations}
			hasNoSanction={hasNoSanction}
			userPhone={userPhone}
		/>
	);
}
