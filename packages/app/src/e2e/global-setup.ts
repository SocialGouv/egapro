import {
	pushCampaignDeadlinesFarFuture,
	resetDeclarationToDraft,
} from "./helpers/db";

/**
 * Reset DB state before E2E tests so runs are idempotent.
 *
 * Re-asserts the far-future campaign deadlines the unpinned suite relies on and
 * clears any leftover declaration. Both touch only year-scoped rows that carry no
 * FK on `app_company`, so they are safe on a pristine database.
 *
 * The >= 250 GIP baseline is deliberately NOT re-asserted here: `app_gip_mds_data`
 * references `app_company`, whose row only exists once the first ProConnect login
 * has run — and `globalSetup` runs before the `setup` project that performs it.
 * Seeding it here would violate the FK and abort the whole suite on a fresh DB.
 * `auth.setup.ts` re-asserts the GIP baseline right after that login (and so also
 * heals a company a hard-interrupted campaign-year grid run (#4022/#4067) may have
 * left flattened), which is the correct — and only viable — place for it.
 */
export default async function globalSetup() {
	await pushCampaignDeadlinesFarFuture();
	await resetDeclarationToDraft();
}
