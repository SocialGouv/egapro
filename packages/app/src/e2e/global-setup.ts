import { resetDeclarationToDraft } from "./helpers/declaration-reset";

/** Reset DB state before E2E tests so runs are idempotent. */
export default async function globalSetup() {
	await resetDeclarationToDraft();
}
