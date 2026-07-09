import "server-only";

import { redirect } from "next/navigation";

import { getCurrentYear, parseSiren } from "~/modules/domain";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api } from "~/trpc/server";

import { CompanyDeclarationsPage } from "./CompanyDeclarationsPage";

type Props = {
	siret: string | null;
	userPhone: string | null;
};

export async function MonEspacePage({ siret, userPhone }: Props) {
	const siren = parseSiren(siret);
	if (siren === null) {
		redirect("/mon-espace/mes-entreprises");
	}
	const [data, sanctionStatus, campaignDeadlines, lockState] =
		await Promise.all([
			api.company.getWithDeclarations({ siren }),
			api.company.getSanctionStatus({ siren }),
			getCampaignDeadlines(getCurrentYear()),
			api.declarationLock.getActiveLockForCurrentDeclaration(),
		]);

	const hasNoSanction = sanctionStatus !== null && !sanctionStatus.hasSanction;

	return (
		<CompanyDeclarationsPage
			campaignDeadlines={campaignDeadlines}
			company={data.company}
			declarations={data.declarations}
			hasNoSanction={hasNoSanction}
			lockedByOther={lockState.lockedByOther}
			lockHolder={lockState.holder}
			userPhone={userPhone}
		/>
	);
}
