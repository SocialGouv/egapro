export { FunnelCompleteTracker } from "./FunnelCompleteTracker";
export { FunnelStepTracker } from "./FunnelStepTracker";
export { MatomoAnalytics } from "./MatomoAnalytics";
export type { FunnelConfig, MatomoEvent } from "./shared/events";
export {
	buildFunnelStepKeys,
	campaignYearDimension,
	MATOMO_ACTION,
	MATOMO_CUSTOM_DIMENSION,
	MATOMO_EVENT_CATEGORY,
	MATOMO_FUNNEL_ACTION,
} from "./shared/events";
export { TrackedLink } from "./TrackedLink";
export { trackEvent } from "./trackEvent";
export {
	elapsedSeconds,
	trackFunnelComplete,
	useFunnelTracking,
} from "./useFunnelTracking";
