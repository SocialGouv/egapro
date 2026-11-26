import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { readServiceStatusOverview } from "~/server/services/serviceStatus";

export const adminStatusRouter = createTRPCRouter({
	getOverview: adminProcedure.query(({ ctx }) =>
		readServiceStatusOverview(ctx.db),
	),
});
