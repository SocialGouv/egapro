"use client";

import { env } from "~/env";

type Props = {
	onFill: () => void;
	disabled?: boolean;
};

export function DevFillButton({ onFill, disabled = false }: Props) {
	if (env.NEXT_PUBLIC_EGAPRO_ENV !== "dev") return null;

	return (
		<button
			className="fr-btn fr-btn--sm fr-btn--tertiary fr-icon-edit-line fr-btn--icon-left"
			disabled={disabled}
			onClick={onFill}
			type="button"
		>
			[DEV] Remplir
		</button>
	);
}
