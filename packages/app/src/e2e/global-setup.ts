import {
	pushCampaignDeadlinesFarFuture,
	resetDeclarationToDraft,
	resetGipWorkforce,
} from "./helpers/db";

/**
 * Reset DB state before E2E tests so runs are idempotent.
 *
 * Re-asserts the calendar-year baseline the unpinned suite relies on: far-future
 * deadlines and the >= 250 GIP workforce. This also heals the coordinate a
 * hard-interrupted campaign-year grid run (#4022) may have left flattened, since
 * `withCampaignYear`'s safety net resets the calendar year too.
 */
export default async function globalSetup() {
	await pushCampaignDeadlinesFarFuture();
	await resetGipWorkforce();
	await resetDeclarationToDraft();
}
