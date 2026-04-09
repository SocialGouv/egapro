import type { RouterOutputs } from "~/trpc/react";

export type ReferentSearchRow =
	RouterOutputs["adminReferents"]["search"]["rows"][number];
