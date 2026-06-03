import { DECLARATION_STEPS } from "~/modules/domain";

export const MATOMO_EVENT_CATEGORY = {
	DECLARATION: "declaration",
} as const;

export const MATOMO_DECLARATION_ACTION = {
	FUNNEL_START: "funnel_start",
	STEP_COMPLETE: "step_complete",
	FUNNEL_COMPLETE: "funnel_complete",
	FUNNEL_ABANDON: "funnel_abandon",
} as const;

export const MATOMO_FUNNEL_STEP_KEYS: readonly string[] = DECLARATION_STEPS.map(
	(entry) => `step_${entry.step}`,
);

// Slot IDs must match the Custom Dimension slots configured in the Matomo
// admin (out-of-code coordination); a wrong ID makes the dimension silently
// ignored. Centralised here so the value is never duplicated as a magic number.
export const MATOMO_CUSTOM_DIMENSION = {
	CAMPAIGN_YEAR: 1,
	WORKFORCE_RANGE: 2,
} as const;

export type MatomoEvent = {
	category: string;
	action: string;
	name?: string;
	value?: number;
	dimensions?: Record<number, string>;
};
