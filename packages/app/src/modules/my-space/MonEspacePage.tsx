import "server-only";

import { MissingSiret } from "~/modules/declaration-remuneration";
import {
	getCurrentYear,
	getReferenceYearFor,
	parseSiren,
} from "~/modules/domain";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { getRepresentationCampaign } from "~/server/db/getRepresentationCampaign";
import { api } from "~/trpc/server";
import { CompanyDeclarationsPage } from "./CompanyDeclarationsPage";

type Props = {
	siret: string | null;
	userPhone: string | null;
};

export async function MonEspacePage({ siret, userPhone }: Props) {
	const siren = parseSiren(siret);
	if (siren === null) {
		return <MissingSiret />;
	}
	const currentYear = getCurrentYear();
	const representationYear = getReferenceYearFor(currentYear);
	const getRepresentationLockState =
		api.representationDeclaration?.getLockState;
	const [
		data,
		campaignDeadlines,
		representationCampaign,
		lockState,
		representationLock,
	] = await Promise.all([
		api.company.getWithDeclarations({ siren }),
		getCampaignDeadlines(currentYear),
		getRepresentationCampaign(currentYear),
		api.declarationLock.getActiveLockForCurrentDeclaration(),
		getRepresentationLockState
			? getRepresentationLockState({ year: representationYear })
			: Promise.resolve({ locked: false, isOwnLock: false, holder: null }),
	]);

	return (
		<CompanyDeclarationsPage
			campaignDeadlines={campaignDeadlines}
			company={data.company}
			declarations={data.declarations}
			lockedByOther={lockState.lockedByOther}
			lockHolder={lockState.holder}
			representationCampaign={representationCampaign}
			representationLockedByOther={
				representationLock.locked && !representationLock.isOwnLock
			}
			representationLockHolder={representationLock.holder}
			userPhone={userPhone}
		/>
	);
}
