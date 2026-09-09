import {
	getAvisCseUrl,
	getCompliancePathUrl,
	getCorrectiveActionsUrl,
	getDeclarationUrl,
	getJointEvaluationUrl,
	getLoginUrl,
	getMySpaceUrl,
	getPublicUrl,
} from "notifications/mails";
import { describe, expect, it } from "vitest";
import {
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION,
	complianceStepHref,
	DECLARATION_REMUNERATION,
	LOGIN,
	MY_SPACE,
} from "~/modules/routes";

// `packages/notifications` builds absolute mail links and cannot import
// `~/modules/routes`: no dependency on the app, no `paths` in its tsconfig, and
// `next.config.js` holds it outside the bundler. So the paths are mirrored, and
// the assertion lives here because the app can import that package while the
// reverse is impossible — same arrangement as `notifications/src/dates.ts`.
// A red line means a route moved and the mail links now point at a 404: fix
// `packages/notifications/src/mails/shared/urls.ts`, not this test.
describe("notifications mail URLs mirror the app routes", () => {
	const origin = getPublicUrl();

	it.each([
		["login", getLoginUrl(), LOGIN],
		["mon espace", getMySpaceUrl(), MY_SPACE],
		["déclaration", getDeclarationUrl(), DECLARATION_REMUNERATION],
		["parcours de conformité", getCompliancePathUrl(), COMPLIANCE_PATH],
		["actions correctives", getCorrectiveActionsUrl(), complianceStepHref(1)],
		[
			"évaluation conjointe",
			getJointEvaluationUrl(),
			COMPLIANCE_JOINT_EVALUATION,
		],
		["avis du CSE", getAvisCseUrl(), CSE_OPINION],
	])("%s", (_label, mailUrl, appPath) => {
		expect(mailUrl).toBe(`${origin}${appPath}`);
	});

	it("prefixes every mail URL with the configured origin and nothing else", () => {
		expect(new URL(getAvisCseUrl()).pathname).toBe(CSE_OPINION);
	});
});
