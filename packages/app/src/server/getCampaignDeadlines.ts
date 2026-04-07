import "server-only";

import { env } from "~/env.js";
import type { CampaignDeadlines } from "~/modules/domain";

function parseDate(dateStr: string): Date {
	return new Date(`${dateStr}T00:00:00`);
}

/** Returns campaign deadlines from env vars. Validated at startup via env.js. */
export function getCampaignDeadlines(): CampaignDeadlines {
	return {
		decl1ModificationDeadline: parseDate(
			env.EGAPRO_DECL1_MODIFICATION_DEADLINE,
		),
		decl1JustificationDeadline: parseDate(
			env.EGAPRO_DECL1_JUSTIFICATION_DEADLINE,
		),
		decl1JointEvaluationDeadline: parseDate(
			env.EGAPRO_DECL1_JOINT_EVALUATION_DEADLINE,
		),
		decl2ModificationDeadline: parseDate(
			env.EGAPRO_DECL2_MODIFICATION_DEADLINE,
		),
		decl2JustificationDeadline: parseDate(
			env.EGAPRO_DECL2_JUSTIFICATION_DEADLINE,
		),
		decl2JointEvaluationDeadline: parseDate(
			env.EGAPRO_DECL2_JOINT_EVALUATION_DEADLINE,
		),
	};
}
