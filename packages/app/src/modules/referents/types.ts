import type { RouterOutputs } from "~/trpc/react";

export type PublicReferentListRow =
	RouterOutputs["publicReferents"]["search"]["rows"][number];

export type PublicReferentDetail = NonNullable<
	RouterOutputs["publicReferents"]["getById"]
>;
