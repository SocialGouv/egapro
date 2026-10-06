import { parseSiren } from "~/modules/domain";
import { isUserLinkedToSiren } from "./companyLink";

const COMPANY_LINK_RECHECK_SECONDS = 5 * 60;

type CompanyLinkToken = {
	id: string;
	siret?: string | null;
	companyLinkCheckedAt?: number;
};

export function toEpochSeconds(date: Date): number {
	return Math.floor(date.getTime() / 1000);
}

export async function recheckCompanyLink(
	token: CompanyLinkToken,
	now: Date,
): Promise<void> {
	const nowSeconds = toEpochSeconds(now);
	if (
		token.companyLinkCheckedAt !== undefined &&
		nowSeconds - token.companyLinkCheckedAt < COMPANY_LINK_RECHECK_SECONDS
	) {
		return;
	}

	const siren = parseSiren(token.siret);
	if (!siren) return;

	let linked: boolean;
	try {
		linked = await isUserLinkedToSiren(token.id, siren);
	} catch (error) {
		// Fail-open: an outage must not sign everyone out; the stale stamp retries on the next request.
		console.error("[auth] company link re-check failed", error);
		return;
	}

	if (!linked) token.siret = null;
	token.companyLinkCheckedAt = nowSeconds;
}
