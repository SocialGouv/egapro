import {
	buildFunnelStepKeys,
	type FunnelConfig,
	MATOMO_EVENT_CATEGORY,
} from "~/modules/analytics";
import { TOTAL_STEPS } from "./types";

export const CSE_FUNNEL: FunnelConfig = {
	category: MATOMO_EVENT_CATEGORY.CSE_OPINION,
	stepKeys: buildFunnelStepKeys(TOTAL_STEPS),
	storageKey: "egapro:cse-funnel",
};
