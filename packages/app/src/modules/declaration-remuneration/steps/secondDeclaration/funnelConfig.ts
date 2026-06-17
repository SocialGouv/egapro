import {
	buildFunnelStepKeys,
	type FunnelConfig,
	MATOMO_EVENT_CATEGORY,
} from "~/modules/analytics";
import { SECOND_DECLARATION_TOTAL_STEPS } from "./constants";

export const COMPLIANCE_FUNNEL: FunnelConfig = {
	category: MATOMO_EVENT_CATEGORY.COMPLIANCE_PATH,
	stepKeys: buildFunnelStepKeys(SECOND_DECLARATION_TOTAL_STEPS),
	storageKey: "egapro:compliance-funnel",
};
