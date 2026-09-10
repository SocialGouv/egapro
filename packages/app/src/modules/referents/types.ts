import type { inferRouterOutputs } from "@trpc/server";

import type { publicReferentsRouter } from "~/server/api/routers/publicReferents";

type PublicReferentsOutputs = inferRouterOutputs<typeof publicReferentsRouter>;

export type PublicReferentListRow =
	PublicReferentsOutputs["search"]["rows"][number];

export type PublicReferentDetail = NonNullable<
	PublicReferentsOutputs["getById"]
>;
