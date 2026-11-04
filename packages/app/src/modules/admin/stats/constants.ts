import {
	DROPOFF_RATE_ALERT_THRESHOLD,
	formatWholePercentage,
} from "~/modules/domain";
import type { StatsPhase } from "./types";

export const DROPOFF_ALERT_MARK = "▲";

export const DROPOFF_THRESHOLD_COLUMN_LABEL = `Au-dessus du seuil de ${formatWholePercentage(DROPOFF_RATE_ALERT_THRESHOLD)}`;

export const PHASE_LABELS: Record<StatsPhase, string> = {
	wizard: "Parcours initial (wizard A–F)",
	post_submit: "Démarche post-transmission",
};

type DropoffBarTone = {
	color: string;
	swatchClass: string;
};

export const DROPOFF_BAR_TONES: Record<
	StatsPhase,
	{ normal: DropoffBarTone; alert: DropoffBarTone }
> = {
	wizard: {
		normal: {
			color: "var(--background-action-high-blue-france)",
			swatchClass: "fr-background-action-high--blue-france",
		},
		alert: {
			color: "var(--background-action-high-red-marianne)",
			swatchClass: "fr-background-action-high--red-marianne",
		},
	},
	post_submit: {
		normal: {
			color: "var(--background-action-low-blue-france)",
			swatchClass: "fr-background-action-low--blue-france",
		},
		alert: {
			color: "var(--background-action-low-red-marianne)",
			swatchClass: "fr-background-action-low--red-marianne",
		},
	},
};
