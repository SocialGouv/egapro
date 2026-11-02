import {
	buildFunnelStepKeys,
	type FunnelConfig,
	MATOMO_CUSTOM_DIMENSION,
	MATOMO_EVENT_CATEGORY,
} from "~/modules/analytics";
import { DECLARATION_STEPS } from "~/modules/domain";

export const DECLARATION_FUNNEL: FunnelConfig = {
	category: MATOMO_EVENT_CATEGORY.DECLARATION,
	stepKeys: buildFunnelStepKeys(DECLARATION_STEPS.length - 1),
	storageKey: "egapro:declaration-funnel",
};

export function declarationFunnelDimensions(
	year: number,
	sizeRange: string,
): Record<number, string> {
	return {
		[MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: String(year),
		[MATOMO_CUSTOM_DIMENSION.WORKFORCE_RANGE]: sizeRange,
	};
}
