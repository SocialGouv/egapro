"use client";

import {
	campaignYearDimension,
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { getCurrentYear } from "~/modules/domain";
import { api } from "~/trpc/react";

type UseUpdateHasCseOptions = {
	onSuccess?: () => void;
};

/**
 * Shared mutation hook for the company CSE status.
 *
 * Wraps `company.updateHasCse` and emits a single anonymised Matomo event on
 * success (`cse_status / cse_status_confirm`, name = "oui" | "non") so the
 * `/admin/stats` confirmation-volume KPI is fed from one place rather than
 * duplicated across the three modals that update the field.
 *
 * The SIREN is **never** sent to Matomo — only the bounded oui/non label — so
 * the CNIL consent exemption (full anonymisation) stays intact. The event fires
 * on success only, so an impersonation-blocked write never produces one.
 */
export function useUpdateHasCse(options?: UseUpdateHasCseOptions) {
	return api.company.updateHasCse.useMutation({
		onSuccess: (_data, variables) => {
			trackEvent({
				category: MATOMO_EVENT_CATEGORY.CSE_STATUS,
				action: MATOMO_ACTION.CSE_STATUS_CONFIRM,
				name: variables.hasCse ? "oui" : "non",
				dimensions: campaignYearDimension(getCurrentYear()),
			});
			options?.onSuccess?.();
		},
	});
}
