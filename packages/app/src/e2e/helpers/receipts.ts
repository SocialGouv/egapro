import { expect, test } from "@playwright/test";
import { TEST_USER_EMAIL } from "../constants";
import { type MailDevEmail, maildevReachable, waitForEmail } from "./maildev";
import { isMailFlowEnabled } from "./notifications-worker";

// #4293 — the three confirmation variants are only distinguishable this way:
// `completed` owns a subject of its own, while `cse_to_deposit` and
// `path_to_select` share one, so only the body tells those two apart.
export const COMPLETED_DECLARATION_SUBJECT =
	"Egapro - Transmission de déclaration et fin de démarche";
export const COMPLETED_SECOND_DECLARATION_SUBJECT =
	"Egapro - Transmission de la seconde déclaration et fin de démarche";
export const DEMARCHE_COMPLETED_WORDING =
	/Votre démarche est désormais terminée/;
export const CSE_TO_DEPOSIT_WORDING = /déposer le ou les avis du CSE/;
export const PATH_TO_SELECT_WORDING =
	/sélectionner un parcours de mise en conformité/;

/** Which declaration the acknowledgement closes: round 1 or the second declaration. */
export type ReceiptRound = "first" | "second";

/**
 * Whether the publisher → pg-boss → worker → SMTP → MailDev chain can deliver at
 * all. `MAIL_ENABLED` is the app server's own switch (the publisher is a no-op
 * without it), MailDev is the sink — either one down and no receipt can arrive,
 * for reasons that have nothing to do with the business rule under test.
 */
export async function mailChainAvailable(): Promise<boolean> {
	return isMailFlowEnabled() && (await maildevReachable());
}

/**
 * Assert the end-of-démarche acknowledgement of the justify-without-CSE paths
 * (#4293). The subject pins the `completed` variant; the negative match on
 * `path_to_select` is what catches a regression to the pre-#4293 wording, which
 * asked for a compliance path the company had just chosen.
 */
export async function expectCompletionReceipt(options: {
	round: ReceiptRound;
	since: Date;
}): Promise<MailDevEmail> {
	const subject =
		options.round === "second"
			? COMPLETED_SECOND_DECLARATION_SUBJECT
			: COMPLETED_DECLARATION_SUBJECT;
	const email = await waitForEmail(
		TEST_USER_EMAIL,
		(m) => m.subject === subject,
		{ since: options.since },
	);
	expect(email.to.some((r) => r.address === TEST_USER_EMAIL)).toBe(true);
	expect(email.html).toMatch(DEMARCHE_COMPLETED_WORDING);
	expect(email.html).not.toMatch(PATH_TO_SELECT_WORDING);
	return email;
}

/**
 * Grid flavour of {@link expectCompletionReceipt}. The 185-coordinate recette is
 * a business run whose mail chain is an environment property (docker stack +
 * `MAIL_ENABLED`), not a business one: with the chain down the coordinate still
 * asserts its parcours, and says so in an annotation rather than passing as if
 * the acknowledgement had been checked.
 */
export async function expectCompletionReceiptWhenMailChainUp(options: {
	round: ReceiptRound;
	since: Date;
}): Promise<void> {
	if (!(await mailChainAvailable())) {
		test.info().annotations.push({
			type: "accusé de réception non vérifié",
			description:
				"chaîne mail indisponible (MAIL_ENABLED / MailDev) — le parcours est vérifié, pas l'accusé de réception",
		});
		return;
	}
	await test.step("accusé de réception de fin de démarche (#4293)", async () => {
		await expectCompletionReceipt(options);
	});
}
