import type { inferRouterOutputs } from "@trpc/server";

import type { adminSettingsRouter } from "~/server/api/routers/adminSettings";

type AdminSettingsOutputs = inferRouterOutputs<typeof adminSettingsRouter>;

export type CampaignDeadlinesByYear =
	AdminSettingsOutputs["getDeadlinesByYear"];
