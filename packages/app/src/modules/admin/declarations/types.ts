import type { RouterOutputs } from "~/trpc/react";

export type DeclarationSearchRow =
	RouterOutputs["adminDeclarations"]["search"]["rows"][number];

export type DeclarationDetail = NonNullable<
	RouterOutputs["adminDeclarations"]["getById"]
>;
