"use client";

import { env } from "~/env";

type Props = {
	onFill: () => void;
};

export function DevFillButton({ onFill }: Props) {
	if (env.NEXT_PUBLIC_EGAPRO_ENV !== "dev") return null;

	return (
		<button
			className="fr-btn fr-btn--sm fr-btn--tertiary fr-icon-edit-line fr-btn--icon-left"
			onClick={onFill}
			type="button"
		>
			[DEV] Remplir
		</button>
	);
}
