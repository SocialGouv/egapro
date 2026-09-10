import type { inferRouterOutputs } from "@trpc/server";

import type { adminReferentsRouter } from "~/server/api/routers/adminReferents";

type AdminReferentsOutputs = inferRouterOutputs<typeof adminReferentsRouter>;

export type ReferentSearchRow = AdminReferentsOutputs["search"]["rows"][number];
