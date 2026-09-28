"use client";

import { useEffect } from "react";

import type { FunnelConfig } from "./shared/events";
import { trackFunnelComplete } from "./useFunnelTracking";

type Props = {
	config: FunnelConfig;
	dimensions?: Record<number, string>;
};

// Fires `funnel_complete` on mount then clears the funnel state. Idempotent: a
// revisit with no active funnel is a no-op, so no double-count. Renders nothing.
export function FunnelCompleteTracker({ config, dimensions }: Props): null {
	useEffect(() => {
		trackFunnelComplete(config, dimensions);
	}, [config, dimensions]);
	return null;
}
