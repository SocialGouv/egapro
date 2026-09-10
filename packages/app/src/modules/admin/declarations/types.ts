import type { inferRouterOutputs } from "@trpc/server";

import type { adminDeclarationsRouter } from "~/server/api/routers/adminDeclarations";

type AdminDeclarationsOutputs = inferRouterOutputs<
	typeof adminDeclarationsRouter
>;

export type DeclarationSearchRow =
	AdminDeclarationsOutputs["search"]["rows"][number];

export type DeclarationDetail = NonNullable<
	AdminDeclarationsOutputs["getById"]
>;
