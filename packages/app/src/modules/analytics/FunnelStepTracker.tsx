"use client";

import type { FunnelConfig } from "./shared/events";
import { useFunnelTracking } from "./useFunnelTracking";

type Props = {
	config: FunnelConfig;
	step: number;
	dimensions?: Record<number, string>;
};

// Drives `useFunnelTracking` from a Server Component step page (server pages
// cannot call hooks). Renders nothing.
export function FunnelStepTracker({ config, step, dimensions }: Props): null {
	useFunnelTracking(config, { step, dimensions });
	return null;
}
